import { ObjectId } from "mongoose";

export type TEmployee = {
    employeeId: string,
    userId: ObjectId,
    department: string,
    designation: string,
    joiningDate: Date,
    employmentType: string,
    accountStatus: string
};