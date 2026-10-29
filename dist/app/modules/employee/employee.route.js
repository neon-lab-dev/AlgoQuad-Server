"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const employee_controller_1 = require("./employee.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const multer_config_1 = require("../../config/multer.config");
const router = express_1.default.Router();
// Add Employee
router.post("/add", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), employee_controller_1.EmployeeController.addEmployee);
// Get All
router.get("/", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin), employee_controller_1.EmployeeController.getAllEmployees);
router.get("/my-profile", (0, auth_1.default)(auth_constants_1.UserRole.employee, auth_constants_1.UserRole.hr), employee_controller_1.EmployeeController.getMyProfile);
// Get Single
router.get("/:id", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin), employee_controller_1.EmployeeController.getSingleEmployee);
//  Update
router.patch("/update/:id", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin), multer_config_1.multerUpload.single("file"), employee_controller_1.EmployeeController.updateEmployee);
// Delete
router.delete("/delete/:id", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin), employee_controller_1.EmployeeController.deleteEmployee);
exports.EmployeeRoutes = router;
