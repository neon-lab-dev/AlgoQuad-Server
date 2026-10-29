// src/app/modules/timesheet/timesheet.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { TimesheetService } from "./timesheet.service";

// 1. Get My Timesheet
const getMyTimesheet = catchAsync(async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const userId = req.user._id; // From Auth Middleware

    const result = await TimesheetService.getMyTimesheetFromDB(
        userId,
        Number(month) || new Date().getMonth(),
        Number(year) || new Date().getFullYear()
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Timesheet fetched successfully",
        data: result,
    });
});

// 2. Get Timesheet of an Employee
const getTimesheetOfAnEmployee = catchAsync(async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const { month, year } = req.query;

    const result = await TimesheetService.getTimesheetOfAnEmployeeFromDB(
        employeeId,
        Number(month) || new Date().getMonth(),
        Number(year) || new Date().getFullYear()
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Employee timesheet fetched successfully",
        data: result,
    });
});

// 3. Add Working Hours
const addWorkingHours = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await TimesheetService.addWorkingHoursIntoDB(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Working hours logged successfully",
        data: result,
    });
});

export const TimesheetController = {
    getMyTimesheet,
    getTimesheetOfAnEmployee,
    addWorkingHours,
};