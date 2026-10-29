"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const timesheet_service_1 = require("./timesheet.service");
// 1. Get My Timesheet
const getMyTimesheet = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, year } = req.query;
    const userId = req.user._id; // From Auth Middleware
    const result = yield timesheet_service_1.TimesheetService.getMyTimesheetFromDB(userId, Number(month) || new Date().getMonth(), Number(year) || new Date().getFullYear());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Timesheet fetched successfully",
        data: result,
    });
}));
// 2. Get Timesheet of an Employee
const getTimesheetOfAnEmployee = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { employeeId } = req.params;
    const { month, year } = req.query;
    const result = yield timesheet_service_1.TimesheetService.getTimesheetOfAnEmployeeFromDB(employeeId, Number(month) || new Date().getMonth(), Number(year) || new Date().getFullYear());
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Employee timesheet fetched successfully",
        data: result,
    });
}));
// 3. Add Working Hours
const addWorkingHours = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const result = yield timesheet_service_1.TimesheetService.addWorkingHoursIntoDB(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Working hours logged successfully",
        data: result,
    });
}));
exports.TimesheetController = {
    getMyTimesheet,
    getTimesheetOfAnEmployee,
    addWorkingHours,
};
