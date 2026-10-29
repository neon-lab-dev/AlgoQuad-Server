import { Model, Types } from "mongoose";

export type TApplicationStatus =
  | "New"
  | "Screening"
  | "Interview"
  | "Selected"
  | "Rejected"
  | "Hired";

export type TApplicationSource =
  | "Website"
  | "Referral"
  | "LinkedIn"
  | "Facebook"
  | "BDJobs"
  | "Walk-in"
  | "Other";

export type TApplicationHistory = {
  status: TApplicationStatus;
  note?: string;
  changedBy?: Types.ObjectId;
  at: Date;
};

export type TApplication = {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
  jobId: Types.ObjectId;
  experience: string;          // e.g. "3 years" or free text
  resumeUrl: string;
  source: string;              // free-form (TApplicationSource | custom)
  resumeRating: number;        // 0–5
  status: TApplicationStatus;

  // Milestone timestamps for quick queries
  screeningAt?: Date | null;
  interviewAt?: Date | null;
  selectedAt?: Date | null;
  rejectedAt?: Date | null;
  hiredAt?: Date | null;

  history: TApplicationHistory[];

  addedBy?: Types.ObjectId;    // admin/hr who manually added the candidate
  isDeleted: boolean;
  referredBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
};

export interface ApplicationModel extends Model<TApplication> {}