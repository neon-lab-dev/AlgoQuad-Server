"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationControllers = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const application_service_1 = require("./application.service");
/* Public — apply on a job */
const applyOnJob = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const file = req.file;
    const result = yield application_service_1.ApplicationServices.applyOnJob(jobId, req.body, file);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Application submitted successfully",
        data: result,
    });
}));
/* Admin/HR — manually add candidate */
const addCandidate = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const file = req.file;
    const result = yield application_service_1.ApplicationServices.addCandidate(userId, req.body, file);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Candidate added successfully",
        data: result,
    });
}));
/* Admin/HR — get all applications */
const getAllApplications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, name, email, phoneNumber, status, jobId, source, minResumeRating, maxResumeRating, skip = "0", limit = "10", } = req.query;
    const result = yield application_service_1.ApplicationServices.getAllApplications({
        keyword: keyword,
        name: name,
        email: email,
        phoneNumber: phoneNumber,
        status: status,
        jobId: jobId,
        source: source,
        minResumeRating: minResumeRating,
        maxResumeRating: maxResumeRating,
    }, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Applications retrieved successfully",
        data: {
            applications: result.data,
            meta: result.meta,
        },
    });
}));
/* Admin/HR — get applications by job */
const getAllApplicationsByJobId = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const { keyword, name, email, phoneNumber, status, source, minResumeRating, maxResumeRating, skip = "0", limit = "10", } = req.query;
    const result = yield application_service_1.ApplicationServices.getAllApplicationsByJobId(jobId, {
        keyword: keyword,
        name: name,
        email: email,
        phoneNumber: phoneNumber,
        status: status,
        source: source,
        minResumeRating: minResumeRating,
        maxResumeRating: maxResumeRating,
    }, Number(skip), Number(limit));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Applications retrieved successfully",
        data: {
            job: result.job,
            applications: result.data,
            meta: result.meta,
        },
    });
}));
/* Admin/HR — get single */
const getSingleApplicationById = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { applicationId } = req.params;
    const result = yield application_service_1.ApplicationServices.getSingleApplicationById(applicationId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Application retrieved successfully",
        data: result,
    });
}));
/* Admin/HR — update */
const updateApplication = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { applicationId } = req.params;
    const actorId = req.user._id;
    const result = yield application_service_1.ApplicationServices.updateApplication(applicationId, actorId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Application updated successfully",
        data: result,
    });
}));
/* Admin/HR — delete (soft) */
const deleteApplication = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { applicationId } = req.params;
    const result = yield application_service_1.ApplicationServices.deleteApplication(applicationId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Application deleted successfully",
        data: result,
    });
}));
exports.ApplicationControllers = {
    applyOnJob,
    addCandidate,
    getAllApplications,
    getAllApplicationsByJobId,
    getSingleApplicationById,
    updateApplication,
    deleteApplication,
};
