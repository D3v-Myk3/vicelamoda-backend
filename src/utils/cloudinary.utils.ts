import { UploadApiResponse } from "cloudinary";
import { Readable } from "stream";
import cloudinary, { cloudinaryConfig } from "../configs/cloudinary.configs";
import { logger } from "../configs/logger.configs";

/* ---------- TIMEOUT PROMISE ---------- */
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Upload timeout")), ms)
  );
  return Promise.race([promise, timeout]);
};

/* ---------- VALIDATE FILE ---------- */
/* const validateFile = (file: any): void => {
  if (!file?.filepath) throw new Error("Missing file path");
  if (!file?.originalFilename) throw new Error("Missing original filename");
  if (!file?.size || file.size === 0) throw new Error("File is empty");
  if (!fs.existsSync(file.filepath)) throw new Error("File not found on disk");
}; */

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<UploadApiResponse> => {
  const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename
          ? `${Date.now()}-${filename.replace(/\.[^/.]+$/, "")}`
          : undefined,
        resource_type: "image",
        timeout: 120000, // Reduced to 2 minutes
      },
      (error, result) => {
        if (error) {
          logger.error("Cloudinary upload error", { error });
          return reject(error);
        }
        if (!result) {
          return reject(new Error("Cloudinary upload result is undefined"));
        }
        resolve(result);
      }
    );

    // Explicitly handle stream errors to prevent app crashes
    uploadStream.on("error", (err) => {
      logger.error("Cloudinary upload stream error", { error: err });
      reject(err);
    });

    // Important: use Readable stream instead of uploadStream.end(buffer)
    const stream = Readable.from(buffer);
    stream.on("error", (err) => {
      logger.error("Buffer read stream error", { error: err });
      reject(err);
    });

    stream.pipe(uploadStream);
  });

  return withTimeout<UploadApiResponse>(
    uploadPromise,
    120000 // Match the cloudinary timeout
  );
};

/* ---------- DELETE WITH TIMEOUT ---------- */
export const deleteFromCloudinary = async (
  publicId: string | null
): Promise<void> => {
  if (!publicId) return;
  const deletePromise = cloudinary.uploader.destroy(publicId);
  return withTimeout(deletePromise, cloudinaryConfig.DELETE_TIMEOUT_MS)
    .then(() => console.log(`Deleted: ${publicId}`))
    .catch((err) => console.warn(`Delete failed: ${publicId}`, err));
};
