import { Schema, model } from "mongoose";
import { TEmployee } from "./employee.interface";

const employeeSchema = new Schema<TEmployee>(
    {
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
);

// Indexes for fast lookups
employeeSchema.index({ department: 1 });
employeeSchema.index({ accountStatus: 1 });

const Employee = model<TEmployee>("Employee", employeeSchema);

export default Employee;