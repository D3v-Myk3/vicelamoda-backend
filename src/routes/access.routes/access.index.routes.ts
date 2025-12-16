import express from "express";
// import adminAccessRoutes from "./admin.access.routes";
import userAccessRoutes from "./user.access.routes";
// import receptionAccessRoutes from "./reception.access.routes";

const accessRoutes = express.Router();

accessRoutes.use(userAccessRoutes);
// accessRoutes.use("/admin", adminAccessRoutes);
// accessRoutes.use("/reception", receptionAccessRoutes);

export default accessRoutes;
