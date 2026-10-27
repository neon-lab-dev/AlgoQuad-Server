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
exports.EmployeeService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const employee_model_1 = __importDefault(require("./employee.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const auth_model_1 = require("../auth/auth.model");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
// Helper to generate ID (AQ-YYMMDD-XXX)
const generateEmployeeId = (joiningDate) => __awaiter(void 0, void 0, void 0, function* () {
    const dateStr = joiningDate.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const prefix = `AQ-${dateStr}-`;
    // Find the latest employee with this prefix
    const lastEmployee = yield employee_model_1.default.findOne({
        employeeId: { $regex: new RegExp(`^${prefix}`) },
    }).sort({ employeeId: -1 });
    let nextSeq = 1;
    if (lastEmployee) {
        const parts = lastEmployee.employeeId.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        nextSeq = lastSeq + 1;
    }
    return `${prefix}${String(nextSeq).padStart(3, "0")}`;
});
// 1. Create Employee (Calls Signup internally)
const addEmployee = (payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield employee_model_1.default.startSession();
    session.startTransaction();
    try {
        // Generate Employee ID
        const joiningDate = new Date(payload.joiningDate || Date.now());
        const employeeId = yield generateEmployeeId(joiningDate);
        let profilePictureUrl;
        if (file) {
            const imageName = `employee-${Date.now()}`;
            const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(imageName, file.path);
            profilePictureUrl = secure_url;
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
            role: "employee",
            profilePicture: profilePictureUrl,
            isFirstLogin: true,
        };
        const user = yield auth_model_1.User.create([userPayload], { session });
        if (!user.length)
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Failed to create user");
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
        const employee = yield employee_model_1.default.create([employeePayload], { session });
        yield session.commitTransaction();
        session.endSession();
        return employee[0];
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
// 2. Get All (Search & Filter)
const getAllEmployees = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    var _a;
    const matchStage = {};
    // 1. Standard filters
    if (filters.department) {
        matchStage.department = filters.department;
    }
    if (filters.status) {
        matchStage.accountStatus = filters.status;
    }
    // 2. Build the Aggregation Pipeline
    const pipeline = [
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
    const result = yield employee_model_1.default.aggregate(pipeline);
    const data = result[0].data;
    const total = ((_a = result[0].metadata[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    return {
        meta: {
            total,
            skip: Number(skip),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        },
        data,
    };
});
// 3. Get Single
const getSingleEmployee = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield employee_model_1.default.findById({ _id: id })
        .populate("userId");
    if (!result)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Employee not found");
    return result;
});
// 4. Update Employee (Updates both Employee and User)
const updateEmployee = (id, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Verify employee exists
    const employee = yield employee_model_1.default.findById(id);
    if (!employee)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Employee not found");
    // 2. Handle image upload (if a new file was provided)
    let imageUrl;
    if (file) {
        const imageName = `employee-${employee.userId}-${Date.now()}`;
        const path = file.path;
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(imageName, path);
        imageUrl = secure_url;
    }
    // 3. Separate user fields from employee fields
    const userFields = ["name", "email", "phoneNumber", "gender", "city", "state", "country", "role", "isDeleted"];
    const employeeFields = ["department", "designation", "joiningDate", "employmentType", "accountStatus"];
    const userUpdates = {};
    const employeeUpdates = {};
    Object.keys(payload).forEach((key) => {
        if (userFields.includes(key))
            userUpdates[key] = payload[key];
        if (employeeFields.includes(key))
            employeeUpdates[key] = payload[key];
    });
    // 4. Attach the new image URL to user updates
    if (imageUrl) {
        userUpdates.profilePicture = imageUrl;
    }
    // 5. Update User
    if (Object.keys(userUpdates).length > 0) {
        yield auth_model_1.User.findByIdAndUpdate(employee.userId, userUpdates, {
            new: true,
            runValidators: true,
        });
    }
    // 6. Update Employee
    if (Object.keys(employeeUpdates).length > 0) {
        yield employee_model_1.default.findByIdAndUpdate(id, employeeUpdates, {
            new: true,
            runValidators: true,
        });
    }
    // 7. Return the fully updated profile
    return yield employee_model_1.default.findById(id).populate("userId", "name email phoneNumber role profilePicture");
});
// 5. Soft Delete
const deleteEmployee = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield employee_model_1.default.findByIdAndUpdate(id, { accountStatus: "Inactive" }, { new: true });
    if (!result)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Employee not found");
    // Also soft-delete or deactivate the User
    yield auth_model_1.User.findByIdAndUpdate(result.userId, { isDeleted: true, status: "inactive" });
    return result;
});
// 6. Get My Profile
const getMyProfile = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield employee_model_1.default.findOne({ userId })
        .populate("userId");
    if (!result)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Employee profile not found");
    return result;
});
exports.EmployeeService = {
    addEmployee,
    getAllEmployees,
    getSingleEmployee,
    updateEmployee,
    deleteEmployee,
    getMyProfile,
};
