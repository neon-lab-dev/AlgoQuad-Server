"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/app/modules/timesheet/timesheet.model.ts
const mongoose_1 = require("mongoose");
const timesheetSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
    },
    hours: {
        type: Number,
        required: true,
        min: 0,
        max: 24,
    },
    month: {
        type: Number,
        required: true,
        min: 0,
        max: 11,
    },
    year: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});
// Compound index to ensure one entry per user per date
timesheetSchema.index({ userId: 1, date: 1 }, { unique: true });
// Index for fast month-based queries
timesheetSchema.index({ userId: 1, year: 1, month: 1 });
const Timesheet = (0, mongoose_1.model)("Timesheet", timesheetSchema);
exports.default = Timesheet;
