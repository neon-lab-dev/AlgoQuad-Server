/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JobServices } from "./job.service";

/* Add Job */
const addJob = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const result = await JobServices.addJob(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Job added successfully",
    data: result,
  });
});

/* Get All Jobs */
const getAllJobs = catchAsync(async (req, res) => {
  const {
    keyword,
    department,
    location,
    employmentType,
    status,
    skip = "0",
    limit = "10",
  } = req.query;

  const filters = {
    keyword: keyword as string,
    department: department as string,
    location: location as string,
    employmentType: employmentType as string,
    status: status as string,
  };

  const result = await JobServices.getAllJobs(
    filters,
    Number(skip),
    Number(limit)
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Jobs retrieved successfully",
    data: {
      jobs: result.data,
      meta: result.meta,
    },
  });
});

/* Get Single Job */
const getSingleJobById = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const result = await JobServices.getSingleJobById(jobId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job retrieved successfully",
    data: result,
  });
});

/* Update Job */
const updateJob = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const result = await JobServices.updateJob(jobId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job updated successfully",
    data: result,
  });
});

/* Delete Job */
const deleteJob = catchAsync(async (req, res) => {
  const { jobId } = req.params;
  const result = await JobServices.deleteJob(jobId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Job deleted successfully",
    data: result,
  });
});

export const JobControllers = {
  addJob,
  getAllJobs,
  getSingleJobById,
  updateJob,
  deleteJob,
};