import { Request, Response, Router } from "express";

import { logger } from "../configs/logger.configs";
import { rateLimiterMiddleware } from "../middlewares/DDos.middlewares";
import { CustomResponse } from "../types/general.types";
import accessRoutes from "./access.routes/access.index.routes";
import adminRoutes from "./admin.routes/admin.index.routes";
import searchRoutes from "./search.routes";
import userRoutes from "./user.routes/user.index.routes";
import productRoutes from "./product.routes";

const router = Router();

router.use(rateLimiterMiddleware);

/* router.use(
  (_req: CustomRequest, res: CustomResponse, next: NextFunction): void => {

    next();
  }
); */

router.use((req, res, next) => {
  req.setTimeout(5 * 60 * 1000); // 5 minutes
  res.setTimeout(5 * 60 * 1000);
  next();
});

router.use("/access", accessRoutes);
router.use("/products", productRoutes);
// router.use("/categories", categoryRoutes);
// router.use("/brands", brandRoutes);
// router.use("/orders", orderRoutes);
router.use("/search", searchRoutes);
// router.use("/sales", salesRoutes);
router.use("/admin", adminRoutes);
router.use(userRoutes);
// router.use("/wishlist", wishlistRoutes);
// router.use("/supplies", supplyRoutes);
// router.use(userRoutes);

// Basic route
router.get("/", (_req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

router.use((req: Request, res: CustomResponse) => {
  logger.info("Server Route Not Found", {
    route: req.originalUrl,
    method: req.method,
    body: req.body,
  });

  res.status(404).json({ data: "", message: "Server Route Not Found" });
});

export default router;
