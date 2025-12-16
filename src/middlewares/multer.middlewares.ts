import { NextFunction, Request } from "express";
import multer from "multer";
import { memStorage } from "../configs/multer.configs/storage.multer.configs";
import { CustomResponse } from "../types/general.types";

// Allowed MIME types
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "video/mp4"];

// File filter for MIME type validation
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};

// const studentsUpload = multer({ storage: studentsStorage });
const studentsUpload = multer({ storage: memStorage });
const productUpload = multer({
  // storage: memStorage,
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 7 * 1024 * 1024, // 7MB
  },
});

export const uploadStudentsAvatar = studentsUpload.fields([
  { name: "student_avatar", maxCount: 1 },
]);

// export const uploadProductImages = productUpload.array("product_images", 5);
export const uploadProductImages = productUpload.fields([
  { name: "primary_image", maxCount: 1 },
  { name: "other_images", maxCount: 4 },
]);

// Custom wrapper to handle Multer errors
export const handleUploadErrors =
  (uploadFn: any) =>
  (req: Request, res: CustomResponse, next: NextFunction) => {
    uploadFn(req, res, (err: any) => {
      console.log("Cloudinary Error");
      console.log(err);

      if (err) {
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            message: `Too many files uploaded. Max allowed is 5.`,
            data: null,
            // details: err.message,
          });
        } else if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: `File too large. Max size is 7MB.`,
            data: null,
          });
        } else {
          return res.status(400).json({
            message: "Multer upload error",
            data: null,
            // details: err.message,
          });
        }
      }
      next(); // everything OK
    });
  };
