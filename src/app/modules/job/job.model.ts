import { Schema, model } from "mongoose";
import { JobModel, TJob } from "./job.interface";

const jobSchema = new Schema<TJob, JobModel>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    openings: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Internship"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Closed", "Draft"],
      default: "Draft",
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: [String],
      default: [],
    },
    perks: {
      type: [String],
      default: [],
    },
    applications: [
      {
        type: Schema.Types.ObjectId,
      },
    ],
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for keyword search
jobSchema.index({ title: "text", description: "text", department: "text" });

const Job = model<TJob, JobModel>("Job", jobSchema);

export default Job;