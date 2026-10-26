"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRoutes = void 0;
const express_1 = __importDefault(require("express"));
const job_controller_1 = require("./job.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const router = express_1.default.Router();
/* Admin-only: create / update / delete */
router.post("/post", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), job_controller_1.JobControllers.addJob);
/* Public: browse & view */
router.get("/", job_controller_1.JobControllers.getAllJobs);
router.get("/:jobId", job_controller_1.JobControllers.getSingleJobById);
/* Admin-only */
router.patch("/update/:jobId", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), job_controller_1.JobControllers.updateJob);
router.delete("/delete/:jobId", (0, auth_1.default)(auth_constants_1.UserRole.admin, auth_constants_1.UserRole.hr), job_controller_1.JobControllers.deleteJob);
exports.JobRoutes = router;
