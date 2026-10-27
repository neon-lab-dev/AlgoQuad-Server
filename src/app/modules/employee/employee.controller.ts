import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { EmployeeService } from "./employee.service";
import httpStatus from "http-status";

// 1. Add Employee
const addEmployee = catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    const result = await EmployeeService.addEmployee(req.body, file);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Employee added successfully",
        data: result,
    });
});

// 2. Get All
const getAllEmployees = catchAsync(async (req: Request, res: Response) => {
    const {
        keyword,
        department,
        location,
        employmentType,
        status,
        skip = "0",
        limit = "10",
    } = req.query;

    const filters = {
        keyword: keyword as string,
        department: department as string,
        location: location as string,
        employmentType: employmentType as string,
        status: status as string,
    };
    const result = await EmployeeService.getAllEmployees(
        filters,
        Number(skip),
        Number(limit)
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Employees fetched successfully",
        data: result.data,
    });
});

// 3. Get Single
const getSingleEmployee = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await EmployeeService.getSingleEmployee(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Employee fetched successfully",
        data: result,
    });
});

// 4. Update
const updateEmployee = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = req.file;
    const result = await EmployeeService.updateEmployee(id, req.body, file);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Employee updated successfully",
        data: result,
    });
});

// 5. Delete
const deleteEmployee = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await EmployeeService.deleteEmployee(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Employee deleted successfully",
        data: result,
    });
});

// 6. Get My Profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await EmployeeService.getMyProfile(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile fetched successfully",
        data: result,
    });
});

export const EmployeeController = {
    addEmployee,
    getAllEmployees,
    getSingleEmployee,
    updateEmployee,
    deleteEmployee,
    getMyProfile,
};