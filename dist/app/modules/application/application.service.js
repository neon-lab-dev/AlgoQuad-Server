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
exports.ApplicationServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = require("mongoose");
const application_model_1 = __importDefault(require("./application.model"));
const job_model_1 = __importDefault(require("../job/job.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const infinitePaginate_1 = require("../../utils/infinitePaginate");
const sendImageToCloudinary_1 = require("../../utils/sendImageToCloudinary");
/* ─── Helper: map status → milestone date field ───────────────── */
const statusDateField = {
    New: null,
    Screening: "screeningAt",
    Interview: "interviewAt",
    Selected: "selectedAt",
    Rejected: "rejectedAt",
    Hired: "hiredAt",
};
/* ─── Public: Apply on a Job ──────────────────────────────────── */
const applyOnJob = (jobId, payload, file) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(jobId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid job id");
    }
    const job = yield job_model_1.default.findById(jobId);
    if (!job) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Job not found");
    }
    if (job.status !== "Active") {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "This job is not accepting applications.");
    }
    const duplicate = yield application_model_1.default.findOne({
        jobId,
        email: payload.email,
        isDeleted: false,
    });
    if (duplicate) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "You have already applied for this job with this email.");
    }
    let resumeUrl = "";
    if (file) {
        const imageName = `resume-${payload.email}-${Date.now()}`;
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(imageName, file.path);
        resumeUrl = secure_url;
    }
    else {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Resume file is required");
    }
    const application = yield application_model_1.default.create(Object.assign(Object.assign({}, payload), { email: payload.email, jobId,
        resumeUrl, status: "New", history: [{ status: "New", at: new Date(), note: "Application submitted" }], referredBy: payload.referrer }));
    // Link application to job
    yield job_model_1.default.findByIdAndUpdate(jobId, {
        $push: { applications: application._id },
    });
    return application;
});
/* ─── Admin/HR: Manually Add Candidate ───────────────────────── */
const addCandidate = (userId, payload, file // <-- Accept the file
) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!mongoose_1.Types.ObjectId.isValid(payload.jobId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid job id");
    }
    const job = yield job_model_1.default.findById(payload.jobId);
    if (!job) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Job not found");
    }
    const status = payload.status || "New";
    const dateField = statusDateField[status];
    const duplicate = yield application_model_1.default.findOne({
        jobId: payload.jobId,
        email: payload.email.toLowerCase(),
        isDeleted: false,
    });
    if (duplicate) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "A candidate with this email already exists for this job.");
    }
    // ---- Upload File to Cloudinary ----
    let resumeUrl = "";
    if (file) {
        const imageName = `resume-${payload.email}-${Date.now()}`;
        const { secure_url } = yield (0, sendImageToCloudinary_1.sendImageToCloudinary)(imageName, file.path);
        resumeUrl = secure_url;
    }
    else {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Resume file is required");
    }
    const data = Object.assign(Object.assign({}, payload), { email: payload.email.toLowerCase(), resumeUrl, resumeRating: (_a = payload.resumeRating) !== null && _a !== void 0 ? _a : 0, status, addedBy: userId, history: [
            {
                status,
                note: "Candidate added manually",
                changedBy: userId,
                at: new Date(),
            },
        ], referredBy: payload.referredBy });
    if (dateField)
        data[dateField] = new Date();
    const application = yield application_model_1.default.create(data);
    yield job_model_1.default.findByIdAndUpdate(payload.jobId, {
        $push: { applications: application._id },
    });
    return application;
});
/* ─── Admin/HR: Get All Applications ─────────────────────────── */
const getAllApplications = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = { isDeleted: false };
    if (filters.status)
        query.status = filters.status;
    if (filters.source)
        query.source = filters.source;
    if (filters.jobId) {
        if (!mongoose_1.Types.ObjectId.isValid(filters.jobId)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid jobId filter");
        }
        query.jobId = filters.jobId;
    }
    if (filters.name)
        query.name = { $regex: filters.name, $options: "i" };
    if (filters.email)
        query.email = { $regex: filters.email, $options: "i" };
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
    return (0, infinitePaginate_1.infinitePaginate)(application_model_1.default, query, skip, limit, [
        { path: "jobId", select: "title department location employmentType status" },
        { path: "referredBy", select: "name email _id" },
    ]);
});
/* ─── Admin/HR: Get Applications for a specific Job ──────────── */
const getAllApplicationsByJobId = (jobId_1, ...args_1) => __awaiter(void 0, [jobId_1, ...args_1], void 0, function* (jobId, filters = {}, skip = 0, limit = 10) {
    if (!mongoose_1.Types.ObjectId.isValid(jobId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid job id");
    }
    const job = yield job_model_1.default.findById(jobId).select("title department");
    if (!job) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Job not found");
    }
    const query = { jobId, isDeleted: false };
    if (filters.status)
        query.status = filters.status;
    if (filters.source)
        query.source = filters.source;
    if (filters.name)
        query.name = { $regex: filters.name, $options: "i" };
    if (filters.email)
        query.email = { $regex: filters.email, $options: "i" };
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
    const result = yield (0, infinitePaginate_1.infinitePaginate)(application_model_1.default, query, skip, limit, [{ path: "jobId", select: "title department location employmentType status" }, { path: "referredBy", select: "name email _id" }]);
    return Object.assign({ job }, result);
});
/* ─── Admin/HR: Get Single Application ───────────────────────── */
const getSingleApplicationById = (applicationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(applicationId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid application id");
    }
    const application = yield application_model_1.default.findOne({
        _id: applicationId,
        isDeleted: false,
    })
        .populate("jobId", "title department location employmentType status")
        .populate("referredBy", "name email _id")
        .populate("addedBy", "name email role")
        .populate("history.changedBy", "name email role");
    if (!application) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Application not found");
    }
    return application;
});
/* ─── Admin/HR: Update Application ───────────────────────────── */
const updateApplication = (applicationId, actorId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(applicationId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid application id");
    }
    const application = yield application_model_1.default.findOne({
        _id: applicationId,
        isDeleted: false,
    });
    if (!application) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Application not found");
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
        if (dateField)
            payload[dateField] = new Date();
        payload.history = [
            ...(application.history || []),
            {
                status: payload.status,
                note: payload.statusNote ||
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
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "resumeRating must be between 0 and 10");
        }
        payload.resumeRating = r;
    }
    Object.assign(application, payload);
    yield application.save();
    return application;
});
/* ─── Admin/HR: Delete Application ───────────────────────────── */
const deleteApplication = (applicationId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.Types.ObjectId.isValid(applicationId)) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid application id");
    }
    const application = yield application_model_1.default.findOne({
        _id: applicationId,
        isDeleted: false,
    });
    if (!application) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Application not found");
    }
    // Soft-delete the application
    application.isDeleted = true;
    yield application.save();
    // Remove reference from the job
    yield job_model_1.default.findByIdAndUpdate(application.jobId, {
        $pull: { applications: application._id },
    });
    return true;
});
exports.ApplicationServices = {
    applyOnJob,
    addCandidate,
    getAllApplications,
    getAllApplicationsByJobId,
    getSingleApplicationById,
    updateApplication,
    deleteApplication,
};
