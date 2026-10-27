"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const employeeSchema = new mongoose_1.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    department: {
        type: String,
        required: true,
        trim: true,
    },
    designation: {
        type: String,
        required: true,
        trim: true,
    },
    joiningDate: {
        type: Date,
        required: true,
    },
    employmentType: {
        type: String,
        required: true,
        enum: ["Full-time", "Part-time", "Contract", "Intern"],
    },
    accountStatus: {
        type: String,
        required: true,
        enum: ["Active", "Inactive"],
        default: "Active",
    },
}, {
    timestamps: true,
});
// Indexes for fast lookups
employeeSchema.index({ department: 1 });
employeeSchema.index({ accountStatus: 1 });
const Employee = (0, mongoose_1.model)("Employee", employeeSchema);
exports.default = Employee;
