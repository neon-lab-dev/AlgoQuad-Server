/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ApplicationServices } from "./application.service";

/* Public — apply on a job */
const applyOnJob = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const file = req.file;
  const result = await ApplicationServices.applyOnJob(jobId, req.body, file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Application submitted successfully",
    data: result,
  });
});

/* Admin/HR — manually add candidate */
const addCandidate = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const file = req.file;
  const result = await ApplicationServices.addCandidate(userId, req.body, file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Candidate added successfully",
    data: result,
  });
});

/* Admin/HR — get all applications */
const getAllApplications = catchAsync(async (req, res) => {
  const {
    keyword,
    name,
    email,
    phoneNumber,
    status,
    jobId,
    source,
    minResumeRating,
    maxResumeRating,
    skip = "0",
    limit = "10",
  } = req.query;

  const result = await ApplicationServices.getAllApplications(
    {
      keyword: keyword as string,
      name: name as string,
      email: email as string,
      phoneNumber: phoneNumber as string,
      status: status as string,
      jobId: jobId as string,
      source: source as string,
      minResumeRating: minResumeRating as string,
      maxResumeRating: maxResumeRating as string,
    },
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applications retrieved successfully",
    data: {
      applications: result.data,
      meta: result.meta,
    },
  });
});

/* Admin/HR — get applications by job */
const getAllApplicationsByJobId = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const {
    keyword,
    name,
    email,
    phoneNumber,
    status,
    source,
    minResumeRating,
    maxResumeRating,
    skip = "0",
    limit = "10",
  } = req.query;

  const result = await ApplicationServices.getAllApplicationsByJobId(
    jobId,
    {
      keyword: keyword as string,
      name: name as string,
      email: email as string,
      phoneNumber: phoneNumber as string,
      status: status as string,
      source: source as string,
      minResumeRating: minResumeRating as string,
      maxResumeRating: maxResumeRating as string,
    },
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applications retrieved successfully",
    data: {
      job: result.job,
      applications: result.data,
      meta: result.meta,
    },
  });
});

/* Admin/HR — get single */
const getSingleApplicationById = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const result = await ApplicationServices.getSingleApplicationById(
    applicationId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Application retrieved successfully",
    data: result,
  });
});

/* Admin/HR — update */
const updateApplication = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const actorId = req.user._id;

  const result = await ApplicationServices.updateApplication(
    applicationId,
    actorId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Application updated successfully",
    data: result,
  });
});

/* Admin/HR — delete (soft) */
const deleteApplication = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const result = await ApplicationServices.deleteApplication(applicationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Application deleted successfully",
    data: result,
  });
});

export const ApplicationControllers = {
  applyOnJob,
  addCandidate,
  getAllApplications,
  getAllApplicationsByJobId,
  getSingleApplicationById,
  updateApplication,
  deleteApplication,
};