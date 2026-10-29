// src/app/modules/timesheet/timesheet.service.ts
import { Types } from "mongoose";
import Timesheet from "./timesheet.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import Employee from "../employee/employee.model";

// Get My Timesheet (For Employee)
const getMyTimesheetFromDB = async (
    userId: string,
    month: number,
    year: number
) => {
    if (!userId) throw new AppError(httpStatus.UNAUTHORIZED, "User not found");

    const timesheets = await Timesheet.find({
        userId: new Types.ObjectId(userId),
        month,
        year,
    }).sort({ date: 1 });

    return timesheets;
};

// Get Timesheet of an Employee (For HR/Admin)
const getTimesheetOfAnEmployeeFromDB = async (
    employeeId: string,
    month: number,
    year: number
) => {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        throw new AppError(httpStatus.BAD_REQUEST, "Employee not found");
    }

    const timesheets = await Timesheet.find({
        userId: employee.userId,
        month,
        year,
    })
        .populate("userId", "name email profilePicture")
        .sort({ date: 1 });

    return timesheets;
};

// Add Working Hours (For Employee)
const addWorkingHoursIntoDB = async (
    userId: string,
    payload: { date: string; hours: number }
) => {
    const { date, hours } = payload;

    if (hours < 0 || hours > 24) {
        throw new AppError(httpStatus.BAD_REQUEST, "Hours must be between 0 and 24");
    }

    // Normalize the date to remove timezone offsets (forces midnight UTC)
    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const month = dateObj.getUTCMonth();
    const year = dateObj.getUTCFullYear();

    // Upsert logic: Create if it doesn't exist, update hours if it does.
    // This prevents duplicate entries for the same day.
    const result = await Timesheet.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), date: dateObj },
        {
            $set: {
                hours: hours,
                month: month,
                year: year,
            },
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
        }
    );

    return result;
};

export const TimesheetService = {
    getMyTimesheetFromDB,
    getTimesheetOfAnEmployeeFromDB,
    addWorkingHoursIntoDB,
};