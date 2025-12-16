import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import WishlistModel from "../models/mongoose/Wishlist.model";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import { ProductTblType } from "../types/product.type";
import {
  AddToWishlistType,
  RemoveFromWishlistType,
} from "../types/wishlist.type";

export const fetchWishlistService: ServiceFunctionParamType<
  unknown,
  ProductTblType[]
> = async (params, { user_data }) => {
  const source = "FETCH WISHLIST SERVICE";
  logger.info("Starting fetchWishlistService", { params });

  try {
    let wishlist = await WishlistModel.findOne({
      user_id: user_data!._id,
    })
      .populate({
        path: "products.product",
        select:
          "name product_price images slug selling_price quantity_in_stock category_id status variants",
        populate: {
          path: "category_id",
          select: "name",
        },
      })
      .lean()
      .exec();

    if (!wishlist) {
      // Create empty wishlist if not exists
      wishlist = (await WishlistModel.create({
        user_id: user_data!._id,
        products: [],
      })) as any;
    }

    // Transform to return list of products directly
    const products = wishlist
      ? wishlist.products
          .filter((item: any) => item.product)
          .map((item: any) => ({
            ...item.product,
            category: item.product.category_id,
            addedAt: item.addedAt,
          }))
      : [];

    /* .map((item) => {
        const product = item.product as unknown as ProductTblType;
        // Attach variant info to top level if needed, or return the item structure
        return {
          ...product,
          // Add a custom field to indicate which variant was wishlisted
          wishlisted_variant_sku: item.,
        };
      }); */

    logger.info(`Wishlist fetched successfully`, {
      source,
      status: StatusCodes.OK,
      count: products.length,
    });

    return {
      data: {
        data: products as unknown as ProductTblType[],
        message: "Wishlist fetched successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const addToWishlistService: ServiceFunctionParamType<
  AddToWishlistType
> = async (params, { user_data }) => {
  const source = "ADD TO WISHLIST SERVICE";
  logger.info("Starting addToWishlistService", { params });

  try {
    let wishlist = await WishlistModel.findOne({ user_id: user_data!._id });

    if (!wishlist) {
      wishlist = await WishlistModel.create({
        user_id: user_data!._id,
        products: [{ product: params.product_id }],
      });
    } else {
      // Check if product (+ variant combination) already exists
      const exists = wishlist.products.some((item) => {
        const sameProduct = item.product.toString() === params.product_id;
        // const sameVariant = item.variant_sku === params.variant_sku;

        // If both have variant_sku, they must match.
        // If stored item has no variant (base product) and new one has variant: they are different?
        // Or strictly:
        /* if (params.variant_sku) {
          return sameProduct && sameVariant;
        } */
        // If adding base product, check if base product exists (ignoring variant ones? or strictly null variant?)
        // Let's assume strict match for now.
        return sameProduct;
      });

      if (exists) {
        /* throw new CustomError({
          data: null,
          errorMessage: "Product already in wishlist",
          source,
          status: StatusCodes.BAD_REQUEST,
        }); */
        return {
          data: { data: "", message: "Product already in wishlist" },
          errorMessage: null,
          source,
          status: StatusCodes.OK,
        };
      }

      wishlist.products.push({
        product: params.product_id,
        // variant_sku: params.variant_sku,
      } as any);
      await wishlist.save();
    }

    logger.info(`Product added to wishlist`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: "", // Keeping empty string as per user pattern
        message: "Product added to wishlist",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const removeFromWishlistService: ServiceFunctionParamType<
  RemoveFromWishlistType
> = async (params, { user_data }) => {
  const source = "REMOVE FROM WISHLIST SERVICE";
  logger.info("Starting removeFromWishlistService", { params });

  try {
    const wishlist = await WishlistModel.findOne({ user_id: user_data!._id });

    if (!wishlist) {
      throw new CustomError({
        data: null,
        errorMessage: "Wishlist not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    wishlist.products = wishlist.products.filter((item) => {
      const sameProduct = item.product.toString() === params.product_id;
      if (!sameProduct) return true; // Keep different products

      // It is the same product. Now check variant.
      // If we are removing a specific variant:
      /* if (params.variant_sku) {
        // Remove if variant matches. Keep if variant doesn't match.
        return item.variant_sku !== params.variant_sku;
      } */

      // If we are removing base product (no variant specified), remove base product entries?
      // Or does removing product ID remove ALL variants of that product?
      // Usually "toggle" removes the specific selection.
      // If user clicks "heart" on base product, it removes base.
      // If user clicks "heart" on variant, it removes variant.
      // return item.variant_sku !== undefined; // Keep items that HAVE a variant if we are removing base (undefined variant)
    });

    await wishlist.save();

    logger.info(`Product removed from wishlist`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: "",
        message: "Product removed from wishlist",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};
