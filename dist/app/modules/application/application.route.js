"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const application_controller_1 = require("./application.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
/* Public — anyone can apply */
router.post("/apply/:jobId", multer_config_1.multerUpload.single("file"), application_controller_1.ApplicationControllers.applyOnJob);
/* Admin/HR */
router.post("/add-candidate", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), multer_config_1.multerUpload.single("file"), application_controller_1.ApplicationControllers.addCandidate);
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), application_controller_1.ApplicationControllers.getAllApplications);
router.get("/by-job/:jobId", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), application_controller_1.ApplicationControllers.getAllApplicationsByJobId);
router.get("/:applicationId", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), application_controller_1.ApplicationControllers.getSingleApplicationById);
router.patch("/update/:applicationId", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), application_controller_1.ApplicationControllers.updateApplication);
router.delete("/delete/:applicationId", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), application_controller_1.ApplicationControllers.deleteApplication);
exports.ApplicationRoutes = router;
