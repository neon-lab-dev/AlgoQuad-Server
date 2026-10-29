/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { Types } from "mongoose";
import Application from "./application.model";
import Job from "../job/job.model";
import AppError from "../../errors/AppError";
import { infinitePaginate } from "../../utils/infinitePaginate";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import { ObjectId } from "mongoose";

/* ─── Helper: map status → milestone date field ───────────────── */
const statusDateField: Record<
  string,
  "screeningAt" | "interviewAt" | "selectedAt" | "rejectedAt" | "hiredAt" | null
> = {
  New: null,
  Screening: "screeningAt",
  Interview: "interviewAt",
  Selected: "selectedAt",
  Rejected: "rejectedAt",
  Hired: "hiredAt",
};

/* ─── Public: Apply on a Job ──────────────────────────────────── */
const applyOnJob = async (
  jobId: string,
  payload: {
    name: string;
    email: string;
    phoneNumber: string;
    experience: string;
    resumeUrl: string;
    referrer?: string | ObjectId;
  },
  file?: Express.Multer.File
) => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid job id");
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, "Job not found");
  }
  if (job.status !== "Active") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This job is not accepting applications."
    );
  }

  const duplicate = await Application.findOne({
    jobId,
    email: payload.email,
    isDeleted: false,
  });
  if (duplicate) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already applied for this job with this email."
    );
  }

  let resumeUrl = "";
  if (file) {
    const imageName = `resume-${payload.email}-${Date.now()}`;
    const { secure_url } = await sendImageToCloudinary(imageName, file.path);
    resumeUrl = secure_url as string;
  } else {
    throw new AppError(httpStatus.BAD_REQUEST, "Resume file is required");
  }

  const application = await Application.create({
    ...payload,
    email: payload.email,
    jobId,
    resumeUrl,
    status: "New",
    history: [{ status: "New", at: new Date(), note: "Application submitted" }],
    referredBy: payload.referrer,
  });

  // Link application to job
  await Job.findByIdAndUpdate(jobId, {
    $push: { applications: application._id },
  });

  return application;
};

/* ─── Admin/HR: Manually Add Candidate ───────────────────────── */
const addCandidate = async (
  userId: string,
  payload: {
    name: string;
    email: string;
    phoneNumber: string;
    jobId: string;
    experience: string;
    source: string;
    referredBy?: string | ObjectId;
    resumeRating?: number;
    status?: string;
  },
  file?: Express.Multer.File // <-- Accept the file
) => {
  if (!Types.ObjectId.isValid(payload.jobId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid job id");
  }

  const job = await Job.findById(payload.jobId);
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, "Job not found");
  }

  const status = payload.status || "New";
  const dateField = statusDateField[status];

  const duplicate = await Application.findOne({
    jobId: payload.jobId,
    email: payload.email.toLowerCase(),
    isDeleted: false,
  });
  if (duplicate) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A candidate with this email already exists for this job."
    );
  }

  // ---- Upload File to Cloudinary ----
  let resumeUrl = "";
  if (file) {
    const imageName = `resume-${payload.email}-${Date.now()}`;
    const { secure_url } = await sendImageToCloudinary(imageName, file.path);
    resumeUrl = secure_url as string;
  } else {
    throw new AppError(httpStatus.BAD_REQUEST, "Resume file is required");
  }

  const data: any = {
    ...payload,
    email: payload.email.toLowerCase(),
    resumeUrl, // <-- Save the URL instead of the raw file
    resumeRating: payload.resumeRating ?? 0,
    status,
    addedBy: userId,
    history: [
      {
        status,
        note: "Candidate added manually",
        changedBy: userId,
        at: new Date(),
      },
    ],
    referredBy: payload.referredBy,
  };

  if (dateField) data[dateField] = new Date();

  const application = await Application.create(data);

  await Job.findByIdAndUpdate(payload.jobId, {
    $push: { applications: application._id },
  });

  return application;
};

/* ─── Admin/HR: Get All Applications ─────────────────────────── */
const getAllApplications = async (
  filters: {
    keyword?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    status?: string;
    jobId?: string;
    source?: string;
    minResumeRating?: string;
    maxResumeRating?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = { isDeleted: false };

  if (filters.status) query.status = filters.status;
  if (filters.source) query.source = filters.source;

  if (filters.jobId) {
    if (!Types.ObjectId.isValid(filters.jobId)) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid jobId filter");
    }
    query.jobId = filters.jobId;
  }

  if (filters.name) query.name = { $regex: filters.name, $options: "i" };
  if (filters.email) query.email = { $regex: filters.email, $options: "i" };
  if (filters.phoneNumber)
    query.phoneNumber = { $regex: filters.phoneNumber, $options: "i" };

  if (filters.minResumeRating || filters.maxResumeRating) {
    query.resumeRating = {};
    if (filters.minResumeRating)
      query.resumeRating.$gte = Number(filters.minResumeRating);
    if (filters.maxResumeRating)
      query.resumeRating.$lte = Number(filters.maxResumeRating);
  }

  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }

  return infinitePaginate(Application, query, skip, limit, [
    { path: "jobId", select: "title department location employmentType status" },
    { path: "referredBy", select: "name email _id" },
  ]);
};

/* ─── Admin/HR: Get Applications for a specific Job ──────────── */
const getAllApplicationsByJobId = async (
  jobId: string,
  filters: {
    keyword?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    status?: string;
    source?: string;
    minResumeRating?: string;
    maxResumeRating?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  if (!Types.ObjectId.isValid(jobId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid job id");
  }

  const job = await Job.findById(jobId).select("title department");
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, "Job not found");
  }

  const query: any = { jobId, isDeleted: false };

  if (filters.status) query.status = filters.status;
  if (filters.source) query.source = filters.source;
  if (filters.name) query.name = { $regex: filters.name, $options: "i" };
  if (filters.email) query.email = { $regex: filters.email, $options: "i" };
  if (filters.phoneNumber)
    query.phoneNumber = { $regex: filters.phoneNumber, $options: "i" };

  if (filters.minResumeRating || filters.maxResumeRating) {
    query.resumeRating = {};
    if (filters.minResumeRating)
      query.resumeRating.$gte = Number(filters.minResumeRating);
    if (filters.maxResumeRating)
      query.resumeRating.$lte = Number(filters.maxResumeRating);
  }

  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }

  const result = await infinitePaginate(Application, query, skip, limit, [{ path: "jobId", select: "title department location employmentType status" }, { path: "referredBy", select: "name email _id" }]);

  return {
    job,
    ...result,
  };
};

/* ─── Admin/HR: Get Single Application ───────────────────────── */
const getSingleApplicationById = async (applicationId: string) => {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid application id");
  }

  const application = await Application.findOne({
    _id: applicationId,
    isDeleted: false,
  })
    .populate("jobId", "title department location employmentType status")
    .populate("referredBy", "name email _id")
    .populate("addedBy", "name email role")
    .populate("history.changedBy", "name email role");

  if (!application) {
    throw new AppError(httpStatus.NOT_FOUND, "Application not found");
  }

  return application;
};

/* ─── Admin/HR: Update Application ───────────────────────────── */
const updateApplication = async (
  applicationId: string,
  actorId: string,
  payload: any
) => {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid application id");
  }

  const application = await Application.findOne({
    _id: applicationId,
    isDeleted: false,
  });
  if (!application) {
    throw new AppError(httpStatus.NOT_FOUND, "Application not found");
  }

  // Never let system-managed fields be overwritten
  delete payload.isDeleted;
  delete payload.addedBy;
  delete payload.jobId;
  delete payload.history;

  const previousStatus = application.status;

  // Handle status change → update milestone date + history
  if (payload.status && payload.status !== previousStatus) {
    const dateField = statusDateField[payload.status];
    if (dateField) payload[dateField] = new Date();

    payload.history = [
      ...(application.history || []),
      {
        status: payload.status,
        note:
          payload.statusNote ||
          `Status changed from ${previousStatus} to ${payload.status}`,
        changedBy: actorId,
        at: new Date(),
      },
    ];
    delete payload.statusNote;
  }

  // Validate rating range
  if (payload.resumeRating !== undefined) {
    const r = Number(payload.resumeRating);
    if (isNaN(r) || r < 0 || r > 10) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "resumeRating must be between 0 and 10"
      );
    }
    payload.resumeRating = r;
  }

  Object.assign(application, payload);
  await application.save();

  return application;
};

/* ─── Admin/HR: Delete Application ───────────────────────────── */
const deleteApplication = async (applicationId: string) => {
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid application id");
  }

  const application = await Application.findOne({
    _id: applicationId,
    isDeleted: false,
  });
  if (!application) {
    throw new AppError(httpStatus.NOT_FOUND, "Application not found");
  }

  // Soft-delete the application
  application.isDeleted = true;
  await application.save();

  // Remove reference from the job
  await Job.findByIdAndUpdate(application.jobId, {
    $pull: { applications: application._id },
  });

  return true;
};

export const ApplicationServices = {
  applyOnJob,
  addCandidate,
  getAllApplications,
  getAllApplicationsByJobId,
  getSingleApplicationById,
  updateApplication,
  deleteApplication,
};