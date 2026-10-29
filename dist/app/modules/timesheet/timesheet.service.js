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
exports.TimesheetService = void 0;
// src/app/modules/timesheet/timesheet.service.ts
const mongoose_1 = require("mongoose");
const timesheet_model_1 = __importDefault(require("./timesheet.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const employee_model_1 = __importDefault(require("../employee/employee.model"));
// Get My Timesheet (For Employee)
const getMyTimesheetFromDB = (userId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId)
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User not found");
    const timesheets = yield timesheet_model_1.default.find({
        userId: new mongoose_1.Types.ObjectId(userId),
        month,
        year,
    }).sort({ date: 1 });
    return timesheets;
});
// Get Timesheet of an Employee (For HR/Admin)
const getTimesheetOfAnEmployeeFromDB = (employeeId, month, year) => __awaiter(void 0, void 0, void 0, function* () {
    const employee = yield employee_model_1.default.findById(employeeId);
    if (!employee) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Employee not found");
    }
    const timesheets = yield timesheet_model_1.default.find({
        userId: employee.userId,
        month,
        year,
    })
        .populate("userId", "name email profilePicture")
        .sort({ date: 1 });
    return timesheets;
});
// Add Working Hours (For Employee)
const addWorkingHoursIntoDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, hours } = payload;
    if (hours < 0 || hours > 24) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Hours must be between 0 and 24");
    }
    // Normalize the date to remove timezone offsets (forces midnight UTC)
    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);
    const month = dateObj.getUTCMonth() + 1;
    const year = dateObj.getUTCFullYear();
    // Upsert logic: Create if it doesn't exist, update hours if it does.
    // This prevents duplicate entries for the same day.
    const result = yield timesheet_model_1.default.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId), date: dateObj }, {
        $set: {
            hours: hours,
            month: month,
            year: year,
        },
    }, {
        new: true,
        upsert: true,
        runValidators: true,
    });
    return result;
});
exports.TimesheetService = {
    getMyTimesheetFromDB,
    getTimesheetOfAnEmployeeFromDB,
    addWorkingHoursIntoDB,
};
