import { cloudinaryConfig } from "../configs/cloudinary.configs";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { CreateProductFormType } from "../schemas/product.zod.schemas";
import {
  createProductService,
  fetchProductByBarcodeService,
  fetchProductsService,
  fetchSingleProductService,
  updateProductService,
} from "../services/product.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import {
  FetchProductsType,
  FetchSingleProductType,
  ProductTblType,
} from "../types/product.type";
import { uploadToCloudinary } from "../utils/cloudinary.utils";

export const createProductController = async (
  req: CustomRequest<unknown, unknown, { product_data: string }, unknown>,
  res: CustomResponse<ProductTblType | null>
): Promise<void> => {
  const source = "CREATE PRODUCT CONTROLLER";
  try {
    logger.info("Starting createProductController", {
      body: req.body,
      path: req.originalUrl,
      ip: req.ip,
    });
    const { admin_data, manager_data } = res.locals;

    const body: CreateProductFormType = JSON.parse(req.body.product_data);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const images: Array<{ image_url: string; is_primary: boolean }> = [];

    // Upload Primary Image
    if (files?.primary_image && files.primary_image.length > 0) {
      const file = files.primary_image[0];
      const result = await uploadToCloudinary(
        file.buffer,
        cloudinaryConfig.product_folder,
        file.originalname
      );

      images.push({ image_url: result.secure_url, is_primary: true });
    }

    // Upload Other Images
    if (files?.other_images && files.other_images.length > 0) {
      for (const file of files.other_images) {
        const result = await uploadToCloudinary(
          file.buffer,
          "vicelamoda/uploads/products",
          file.originalname
        );
        images.push({ image_url: result.secure_url, is_primary: false });
      }
    }

    // Attach images to body
    body.images = images;

    const response = await createProductService(body, {
      admin_data,
      manager_data,
    });

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Create product failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in createProductController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in createProductController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchProductsController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchProductsType>,
  res: CustomResponse<ProductTblType[] | null>
) => {
  const source = "FETCH PRODUCTS CONTROLLER";
  try {
    logger.info("Starting fetchProductsController", {
      query: req.query,
      path: req.originalUrl,
      ip: req.ip,
    });
    const params = req.query as FetchProductsType;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchProductsService(params, {
      admin_data,
      manager_data,
    });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Fetch products failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<ProductTblType[]>;

    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchProductsController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchProductsController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const fetchProductByBarcodeController = async (
  req: CustomRequest<{ code: string }, unknown, unknown, unknown>,
  res: CustomResponse<ProductTblType | null>
): Promise<void> => {
  const source = "FETCH PRODUCT BY BARCODE CONTROLLER";
  try {
    logger.info("Starting fetchProductByBarcodeController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const barcode = req.params.code;
    const { admin_data, manager_data } = res.locals;

    const response = await fetchProductByBarcodeService(
      {
        barcode,
        constraints: {
          images: true,
          category: true,
          brand: true,
        },
      },
      { admin_data, manager_data }
    );

    if (response) {
      const resData = response.data as JSONResponseType<ProductTblType>;
      res.status(response.status).json(resData);
    }
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};

export const fetchSingleProductController = async (
  req: CustomRequest<{ product_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<ProductTblType | null>
): Promise<void> => {
  const source = "FETCH SINGLE PRODUCT CONTROLLER";
  try {
    logger.info("Starting fetchSingleProductController", {
      params: req.params,
      path: req.originalUrl,
      ip: req.ip,
    });
    const product_id = req.params.product_id;
    const constraints = req.query as FetchSingleProductType["constraints"];
    const { admin_data, manager_data } = res.locals;

    const response = await fetchSingleProductService(
      {
        product_id,
        constraints,
      },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      logger.warn("Fetch product failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response?.data as JSONResponseType<ProductTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchSingleProductController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchSingleProductController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};
export const updateProductController = async (
  req: CustomRequest<{ product_id: string }, unknown, { product_data: string }>,
  res: CustomResponse<ProductTblType | null>
): Promise<void> => {
  const source = "UPDATE PRODUCT CONTROLLER";
  try {
    logger.info("Starting updateProductController", {
      body: req.body,
      params: req.params,
    });
    const { product_id } = req.params;
    const { admin_data, manager_data } = res.locals;

    let body: any = {};
    if (req.body.product_data) {
      body = JSON.parse(req.body.product_data);
    } else {
      // Support direct JSON body if no files
      body = req.body;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const images: Array<{ image_url: string; is_primary: boolean }> = [];

    // If new images provided, handle upload
    if (files) {
      if (files.primary_image && files.primary_image.length > 0) {
        const file = files.primary_image[0];
        const result = await uploadToCloudinary(
          file.buffer,
          cloudinaryConfig.product_folder,
          file.originalname
        );
        images.push({ image_url: result.secure_url, is_primary: true });
      }

      if (files.other_images && files.other_images.length > 0) {
        for (const file of files.other_images) {
          const result = await uploadToCloudinary(
            file.buffer,
            "vicelamoda/uploads/products",
            file.originalname
          );
          images.push({ image_url: result.secure_url, is_primary: false });
        }
      }
    }

    if (images.length > 0) {
      body.images = images;
    }

    const response = await updateProductService(
      { product_id, update_data: body },
      { admin_data, manager_data }
    );

    if (!response.data || response.errorMessage || response.status >= 300) {
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<ProductTblType>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      handleErrors({ res, error, source });
    } else {
      defaultError(source, error as string);
    }
  }
};
