import { Router } from "express";
import {
  addToWishlistController,
  fetchWishlistController,
  removeFromWishlistController,
} from "../controllers/wishlist.controller";
// import { authToken } from "../middlewares/auth.middleware";

const wishlistRouter = Router();

wishlistRouter.get("/", fetchWishlistController);
wishlistRouter.post("/:product_id", addToWishlistController);
wishlistRouter.delete("/:product_id", removeFromWishlistController);

export default wishlistRouter;
