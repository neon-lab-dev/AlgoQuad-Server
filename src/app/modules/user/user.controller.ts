import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { UserService } from "./user.service";
import httpStatus from "http-status";


const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.user._id;
    const result = await UserService.getMyProfile(id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Employee fetched successfully",
        data: result,
    });
});


export const UserController = {
    getMyProfile,
};