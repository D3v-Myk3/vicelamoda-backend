import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../cloudinary.configs";

export const productStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    console.log("Logging file:", file);

    const folder = "vicelamoda/uploads/products";

    return {
      folder,
      resource_type: file.mimetype.startsWith("video") ? "video" : "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov"],
      public_id: `${Date.now()}-${file.originalname}`,
      timeout: 300000, // 5 minutes
    };
  },
});
export const memStorage = multer.memoryStorage();

export const studentsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "public/uploads/students");
  },
  filename: (_req, file, cb) => {
    const type = file.mimetype.split("/")[1];
    const typeList = ["jpeg", "png", "jpg", "gif"];
    let err: Error | null = null;
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);

    if (!typeList.includes(type)) err = new Error("Not A Valid Type!!!");

    if (file.size > 2100000) err = new Error("File Shouldn't be more than 2MB");

    cb(err, file.fieldname + "_" + uniqueSuffix + "_" + file.originalname);
  },
});
