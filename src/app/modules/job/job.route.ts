import express from "express";
import { JobControllers } from "./job.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

/* Admin-only: create / update / delete */
router.post(
  "/post",
  auth(UserRole.admin, UserRole.hr),
  JobControllers.addJob
);

/* Public: browse & view */
router.get("/", JobControllers.getAllJobs);
router.get("/:jobId", JobControllers.getSingleJobById);

/* Admin-only */
router.patch(
  "/update/:jobId",
  auth(UserRole.admin, UserRole.hr),
  JobControllers.updateJob
);

router.delete(
  "/delete/:jobId",
  auth(UserRole.admin, UserRole.hr),
  JobControllers.deleteJob
);

export const JobRoutes = router;