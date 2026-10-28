import express from "express";
import { ApplicationControllers } from "./application.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

/* Public — anyone can apply */
router.post(
    "/apply/:jobId",
    multerUpload.single("file"),
    ApplicationControllers.applyOnJob
);

/* Admin/HR */
router.post(
    "/add-candidate",
    auth(UserRole.admin, UserRole.hr),
    multerUpload.single("file"),
    ApplicationControllers.addCandidate
);

router.get(
    "/",
    auth(UserRole.admin, UserRole.hr),
    ApplicationControllers.getAllApplications
);

router.get(
    "/by-job/:jobId",
    auth(UserRole.admin, UserRole.hr),
    ApplicationControllers.getAllApplicationsByJobId
);

router.get(
    "/:applicationId",
    auth(UserRole.admin, UserRole.hr),
    ApplicationControllers.getSingleApplicationById
);

router.patch(
    "/update/:applicationId",
    auth(UserRole.admin, UserRole.hr),
    ApplicationControllers.updateApplication
);

router.delete(
    "/delete/:applicationId",
    auth(UserRole.admin, UserRole.hr),
    ApplicationControllers.deleteApplication
);

export const ApplicationRoutes = router;