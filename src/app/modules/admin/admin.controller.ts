import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AdminService } from "./admin.service";

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin stats fetched successfully",
    data: result,
  });
});

export const AdminController = {
  getAdminStats,
};