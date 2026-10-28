import express from "express";
import { AdminController } from "./admin.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

router.get(
  "/stats",
  auth(UserRole.admin, UserRole.hr), 
  AdminController.getAdminStats
);

export const AdminRoutes = router;