import { Schema, model } from "mongoose";
import { ApplicationModel, TApplication } from "./application.interface";

const historySchema = new Schema(
  {
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
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new Schema<TApplication, ApplicationModel>(
  {
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
      type: Schema.Types.ObjectId,
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
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate applications for the same job by the same email/phone
applicationSchema.index({ jobId: 1, email: 1 }, { unique: true });

// Text index for name/email/phone search
applicationSchema.index({
  name: "text",
  email: "text",
  phoneNumber: "text",
});

const Application = model<TApplication, ApplicationModel>(
  "Application",
  applicationSchema
);

export default Application;