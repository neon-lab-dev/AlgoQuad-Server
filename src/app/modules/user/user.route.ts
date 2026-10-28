import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { UserController } from "./user.controller";

const router = express.Router();

router.get("/me", auth(UserRole.hr, UserRole.admin, UserRole.employee), UserController.getMyProfile);

export const UserRoutes = router;