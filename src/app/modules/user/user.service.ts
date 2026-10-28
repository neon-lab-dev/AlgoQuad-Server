import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { User } from "../auth/auth.model";

const getMyProfile = async (id: string) => {
    const result = await User.findById(id);

    if (!result) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    return result;
};


export const UserService = { getMyProfile }