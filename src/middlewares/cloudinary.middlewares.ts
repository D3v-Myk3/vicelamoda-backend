import { NextFunction, Request } from "express";
import { logger } from "../configs/logger.configs";
import { CustomResponse, MulterRequest } from "../types/general.types";

/**
 * Middleware to process uploaded product images from Cloudinary
 * and attach optimized URLs to req.body in the format expected by the controller
 */
export const processProductImages = (
  req: Request,
  _res: CustomResponse,
  next: NextFunction
) => {
  const source = "PROCESS PRODUCT IMAGES MIDDLEWARE";
  try {
    const multerReq = req as MulterRequest;
    const files = multerReq.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    logger.info("Processing product images", {
      source,
      files: files ? Object.keys(files) : [],
    });

    // Initialize images array
    const images: Array<{ image_url: string; is_primary: boolean }> = [];

    // Process primary image
    if (files?.primary_image && files.primary_image.length > 0) {
      const primaryImage = files.primary_image[0];
      const cloudinaryFile = primaryImage as any;
      console.log(cloudinaryFile);

      logger.info("Primary image found", {
        source,
        path: cloudinaryFile.path,
        filename: cloudinaryFile.filename,
      });

      images.push({
        image_url: cloudinaryFile.path, // Cloudinary URL
        is_primary: true,
      });
    }

    // Process other images
    if (files?.other_images && files.other_images.length > 0) {
      files.other_images.forEach((file) => {
        const cloudinaryFile = file as any;

        logger.info("Other image found", {
          source,
          path: cloudinaryFile.path,
          filename: cloudinaryFile.filename,
        });

        images.push({
          image_url: cloudinaryFile.path, // Cloudinary URL
          is_primary: false,
        });
      });
    }

    // Attach images to req.body
    if (images.length > 0) {
      // Parse existing product_data if it exists
      if (req.body.product_data) {
        try {
          const productData = JSON.parse(req.body.product_data);
          productData.images = images;
          req.body.product_data = JSON.stringify(productData);

          logger.info("Images attached to product_data", {
            source,
            imageCount: images.length,
          });
        } catch (error) {
          logger.error("Failed to parse product_data", {
            source,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } else {
        // If product_data doesn't exist yet, just attach images directly
        req.body.images = images;

        logger.info("Images attached directly to req.body", {
          source,
          imageCount: images.length,
        });
      }
    } else {
      logger.warn("No images uploaded", { source });
    }

    next();
  } catch (error) {
    logger.error("Error processing product images", {
      source,
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
};
