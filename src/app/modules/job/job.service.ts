/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import Job from "./job.model";
import AppError from "../../errors/AppError";
import { infinitePaginate } from "../../utils/infinitePaginate";

/* Add Job */
const addJob = async (userId: any, payload: any) => {
  const toArray = (v: any): string[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const job = await Job.create({
    ...payload,
    skills: toArray(payload.skills),
    responsibilities: toArray(payload.responsibilities),
    qualifications: toArray(payload.qualifications),
    perks: toArray(payload.perks),
    applications: [],
    addedBy: userId,
  });

  return job;
};

/* Get All Jobs */
const getAllJobs = async (
  filters: {
    keyword?: string;
    department?: string;
    location?: string;
    employmentType?: string;
    status?: string;
  } = {},
  skip = 0,
  limit = 10
) => {
  const query: any = {};

  if (filters.department) query.department = filters.department;
  if (filters.location) query.location = filters.location;
  if (filters.employmentType) query.employmentType = filters.employmentType;
  if (filters.status) query.status = filters.status;

  if (filters.keyword) {
    query.$text = { $search: filters.keyword };
  }

  return infinitePaginate(Job, query, skip, limit, ["addedBy" ], "name email role");
};

/* Get Single Job */
const getSingleJobById = async (jobId: string) => {
  const job = await Job.findById(jobId)
    .populate("addedBy", "name email role")

  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, "Job not found");
  }

  return job;
};

/* Update Job */
const updateJob = async (jobId: string, payload: any) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, "Job not found");
  }

  // Never allow applications to be overwritten via update
  delete payload.applications;
  delete payload.addedBy;

  // Normalise array fields
  const toArray = (v: any): string[] | undefined => {
    if (v === undefined) return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      if (v.trim() === "") return [];
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const skills = toArray(payload.skills);
  const responsibilities = toArray(payload.responsibilities);
  const qualifications = toArray(payload.qualifications);
  const perks = toArray(payload.perks);

  if (skills !== undefined) payload.skills = skills;
  if (responsibilities !== undefined) payload.responsibilities = responsibilities;
  if (qualifications !== undefined) payload.qualifications = qualifications;
  if (perks !== undefined) payload.perks = perks;

  const updated = await Job.findByIdAndUpdate(jobId, payload, {
    new: true,
    runValidators: true,
  });

  return updated;
};

/* Delete Job */
const deleteJob = async (jobId: string) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, "Job not found");
  }

  await Job.findByIdAndDelete(jobId);

  return true;
};

export const JobServices = {
  addJob,
  getAllJobs,
  getSingleJobById,
  updateJob,
  deleteJob,
};