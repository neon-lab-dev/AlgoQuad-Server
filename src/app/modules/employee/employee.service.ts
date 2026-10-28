/* eslint-disable @typescript-eslint/no-explicit-any */
import Employee from "./employee.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { User } from "../auth/auth.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";

// Helper to generate ID (AQ-YYMMDD-XXX)
const generateEmployeeId = async (joiningDate: Date) => {
    const dateStr = joiningDate.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const prefix = `AQ-${dateStr}-`;

    // Find the latest employee with this prefix
    const lastEmployee = await Employee.findOne({
        employeeId: { $regex: new RegExp(`^${prefix}`) },
    }).sort({ employeeId: -1 });

    let nextSeq = 1;
    if (lastEmployee) {
        const parts = lastEmployee.employeeId.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        nextSeq = lastSeq + 1;
    }

    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
};

// 1. Create Employee (Calls Signup internally)
const addEmployee = async (payload: any, file?: Express.Multer.File) => {
    const session = await Employee.startSession();
    session.startTransaction();

    try {
        // Generate Employee ID
        const joiningDate = new Date(payload.joiningDate || Date.now());
        const employeeId = await generateEmployeeId(joiningDate);

        let profilePictureUrl: string | undefined;
        if (file) {
            const imageName = `employee-${Date.now()}`;
            const { secure_url } = await sendImageToCloudinary(imageName, file.path);
            profilePictureUrl = secure_url as string;
        }

        // 1. Create User (Signup logic)
        const userPayload = {
            name: payload.name,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            gender: payload.gender,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            password: "12345678", // Default password
            role: payload.role || "employee",
            profilePicture: profilePictureUrl,
            isFirstLogin: true,
        };

        const user = await User.create([userPayload], { session });
        if (!user.length) throw new AppError(httpStatus.BAD_REQUEST, "Failed to create user");

        // 2. Create Employee Profile
        const employeePayload = {
            employeeId,
            userId: user[0]._id,
            department: payload.department,
            designation: payload.designation,
            joiningDate: joiningDate,
            employmentType: payload.employmentType,
            accountStatus: "Active",
        };

        const employee = await Employee.create([employeePayload], { session });

        await session.commitTransaction();
        session.endSession();

        return employee[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// 2. Get All (Search & Filter)
const getAllEmployees = async (
    filters: {
        keyword?: string;
        department?: string;
        status?: string;
    } = {},
    skip = 0,
    limit = 10
) => {
    const matchStage: any = {};

    // 1. Standard filters
    if (filters.department) {
        matchStage.department = filters.department;
    }
    if (filters.status) {
        matchStage.accountStatus = filters.status;
    }

    // 2. Build the Aggregation Pipeline
    const pipeline: any[] = [
        // Join the User model
        {
            $lookup: {
                from: "users", // The actual collection name in MongoDB
                localField: "userId",
                foreignField: "_id",
                as: "userId",
            },
        },
        // Flatten the array so it becomes a direct object
        { $unwind: "$userId" },
    ];

    // 3. Keyword search across BOTH Employee and User fields
    if (filters.keyword) {
        const regex = new RegExp(filters.keyword, "i");
        matchStage.$or = [
            // Employee fields
            { employeeId: regex },
            { department: regex },
            { designation: regex },

            // User fields (Now accessible because of $unwind)
            { "userId.name": regex },
            { "userId.email": regex },
            { "userId.phoneNumber": regex },
            { "userId.city": regex },
            { "userId.state": regex },
            { "userId.country": regex },
            { "userId.gender": regex },
        ];
    }

    // Add the $match stage to the pipeline
    pipeline.push({ $match: matchStage });

    // 4. Facet: Get total count AND paginated data in one query
    pipeline.push({
        $facet: {
            metadata: [{ $count: "total" }],
            data: [
                { $skip: Number(skip) },
                { $limit: Number(limit) },
                // Ensure we return the populated shape the frontend expects
                {
                    $project: {
                        _id: 1,
                        employeeId: 1,
                        department: 1,
                        designation: 1,
                        joiningDate: 1,
                        employmentType: 1,
                        accountStatus: 1,
                        isFirstLogin: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        userId: 1, // The unwound user object
                    }
                }
            ],
        },
    });

    const result = await Employee.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    return {
        meta: {
            total,
            skip: Number(skip),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
        data,
    };
};

// 3. Get Single
const getSingleEmployee = async (id: string) => {
    const result = await Employee.findById({ _id: id })
        .populate("userId");

    if (!result) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");
    return result;
};

// 4. Update Employee (Updates both Employee and User)
const updateEmployee = async (id: string, payload: any, file: any | undefined) => {
    // 1. Verify employee exists
    const employee = await Employee.findById(id);
    if (!employee) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");

    // 2. Handle image upload (if a new file was provided)
    let imageUrl: string | undefined;
    if (file) {
        const imageName = `employee-${employee.userId}-${Date.now()}`;
        const path = file.path;
        const { secure_url } = await sendImageToCloudinary(imageName, path);
        imageUrl = secure_url as string;
    }

    // 3. Separate user fields from employee fields
    const userFields = ["name", "email", "phoneNumber", "gender", "city", "state", "country", "role", "isDeleted"];
    const employeeFields = ["department", "designation", "joiningDate", "employmentType", "accountStatus"];

    const userUpdates: any = {};
    const employeeUpdates: any = {};

    Object.keys(payload).forEach((key) => {
        if (userFields.includes(key)) userUpdates[key] = payload[key];
        if (employeeFields.includes(key)) employeeUpdates[key] = payload[key];
    });

    // 4. Attach the new image URL to user updates
    if (imageUrl) {
        userUpdates.profilePicture = imageUrl;
    }

    // 5. Update User
    if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(employee.userId, userUpdates, {
            new: true,
            runValidators: true,
        });
    }

    // 6. Update Employee
    if (Object.keys(employeeUpdates).length > 0) {
        await Employee.findByIdAndUpdate(id, employeeUpdates, {
            new: true,
            runValidators: true,
        });
    }

    // 7. Return the fully updated profile
    return await Employee.findById(id).populate(
        "userId",
        "name email phoneNumber role profilePicture"
    );
};

// 5. Soft Delete
const deleteEmployee = async (id: string) => {
    const result = await Employee.findByIdAndUpdate(
        id,
        { accountStatus: "Inactive" },
        { new: true }
    );

    if (!result) throw new AppError(httpStatus.NOT_FOUND, "Employee not found");

    // Also soft-delete or deactivate the User
    await User.findByIdAndUpdate(result.userId, { isDeleted: true, status: "inactive" });

    return result;
};

// 6. Get My Profile
const getMyProfile = async (userId: string) => {
    const result = await Employee.findOne({ userId })
        .populate("userId");

    if (!result) throw new AppError(httpStatus.NOT_FOUND, "Employee profile not found");
    return result;
};

export const EmployeeService = {
    addEmployee,
    getAllEmployees,
    getSingleEmployee,
    updateEmployee,
    deleteEmployee,
    getMyProfile,
};