"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const historySchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: [
            "New",
            "Screening",
            "Interview",
            "Selected",
            "Rejected",
            "Hired",
        ],
        required: true,
    },
    note: { type: String, trim: true },
    changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
}, { _id: false });
const applicationSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
    },
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Job",
        required: true,
        index: true,
    },
    experience: {
        type: String,
        required: true,
        trim: true,
    },
    resumeUrl: {
        type: String,
        required: true,
        trim: true,
    },
    source: {
        type: String,
        trim: true,
        default: "system",
    },
    resumeRating: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
    },
    status: {
        type: String,
        enum: [
            "New",
            "Screening",
            "Interview",
            "Selected",
            "Rejected",
            "Hired",
        ],
        default: "New",
        index: true,
    },
    screeningAt: { type: Date, default: null },
    interviewAt: { type: Date, default: null },
    selectedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    hiredAt: { type: Date, default: null },
    history: { type: [historySchema], default: [] },
    addedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
    referredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false, default: null },
}, { timestamps: true });
// Prevent duplicate applications for the same job by the same email/phone
applicationSchema.index({ jobId: 1, email: 1 }, { unique: true });
// Text index for name/email/phone search
applicationSchema.index({
    name: "text",
    email: "text",
    phoneNumber: "text",
});
const Application = (0, mongoose_1.model)("Application", applicationSchema);
exports.default = Application;
