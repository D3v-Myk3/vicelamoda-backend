import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import {
  addToWishlistService,
  fetchWishlistService,
  removeFromWishlistService,
} from "../services/wishlist.service";
import {
  CustomRequest,
  CustomResponse,
  JSONResponseType,
} from "../types/general.types";
import { ProductTblType } from "../types/product.type";

export const fetchWishlistController = async (
  _req: CustomRequest,
  res: CustomResponse<ProductTblType[] | null>
): Promise<void> => {
  const source = "FETCH WISHLIST CONTROLLER";
  logger.info(`Starting fetchWishlistController`, { source });
  try {
    const { user_data } = res.locals;

    const response = await fetchWishlistService({}, { user_data });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Fetch wishlist failed", {
        status: response.status,
        errorMessage: response.errorMessage,
      });
      handleErrors({ response, res });
      return;
    }

    const resData = response.data as JSONResponseType<ProductTblType[]>;
    res.status(response.status).json(resData);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error in fetchWishlistController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in fetchWishlistController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const addToWishlistController = async (
  req: CustomRequest<{ product_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<null>
): Promise<void> => {
  const source = "ADD TO WISHLIST CONTROLLER";
  logger.info(`Starting addToWishlistController`, { source });
  try {
    const { user_data } = res.locals;
    const { product_id } = req.params;

    const response = await addToWishlistService({ product_id }, { user_data });

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Add to wishlist failed", {
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
      logger.error("Error in addToWishlistController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in addToWishlistController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};

export const removeFromWishlistController = async (
  req: CustomRequest<{ product_id: string }, unknown, unknown, unknown>,
  res: CustomResponse<null>
): Promise<void> => {
  const source = "REMOVE FROM WISHLIST CONTROLLER";
  logger.info(`Starting removeFromWishlistController`, { source });
  try {
    const { user_data } = res.locals;
    const { product_id } = req.params;

    const response = await removeFromWishlistService(
      { product_id },
      { user_data }
    );

    if (
      (response?.data === null || response?.errorMessage) &&
      response?.status &&
      response?.status >= 300
    ) {
      logger.warn("Remove from wishlist failed", {
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
      logger.error("Error in removeFromWishlistController", {
        error: error.message,
        stack: error.stack,
      });
      handleErrors({ res, error, source });
    } else {
      logger.error("Unexpected error in removeFromWishlistController", {
        error: String(error),
      });
      defaultError(source, error as string);
    }
  }
};
