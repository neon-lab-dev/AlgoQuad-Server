// src/app/modules/timesheet/timesheet.interface.ts
import { Model, Types } from "mongoose";

export type TTimesheet = {
  userId: Types.ObjectId; // The Employee's User ID
  date: Date;             // The specific day (normalized to midnight UTC)
  hours: number;          // Total hours logged
  month: number;          // 0-11 for quick filtering
  year: number;           // e.g., 2026
};

export type TimesheetModel = Model<TTimesheet>;