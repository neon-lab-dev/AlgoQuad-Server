"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetRoutes = void 0;
const express_1 = __importDefault(require("express"));
const timesheet_controller_1 = require("./timesheet.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const router = express_1.default.Router();
router.get("/my", (0, auth_1.default)(auth_constants_1.UserRole.employee, auth_constants_1.UserRole.hr), timesheet_controller_1.TimesheetController.getMyTimesheet);
router.post("/add-hours", (0, auth_1.default)(auth_constants_1.UserRole.employee, auth_constants_1.UserRole.hr), timesheet_controller_1.TimesheetController.addWorkingHours);
router.get("/employee/:employeeId", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin), timesheet_controller_1.TimesheetController.getTimesheetOfAnEmployee);
exports.TimesheetRoutes = router;
