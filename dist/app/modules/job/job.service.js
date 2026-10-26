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
exports.JobServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const job_model_1 = __importDefault(require("./job.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const infinitePaginate_1 = require("../../utils/infinitePaginate");
/* Add Job */
const addJob = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const toArray = (v) => {
        if (Array.isArray(v))
            return v;
        if (typeof v === "string" && v.trim() !== "") {
            return v.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return [];
    };
    const job = yield job_model_1.default.create(Object.assign(Object.assign({}, payload), { skills: toArray(payload.skills), responsibilities: toArray(payload.responsibilities), qualifications: toArray(payload.qualifications), perks: toArray(payload.perks), applications: [], addedBy: userId }));
    return job;
});
/* Get All Jobs */
const getAllJobs = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, skip = 0, limit = 10) {
    const query = {};
    if (filters.department)
        query.department = filters.department;
    if (filters.location)
        query.location = filters.location;
    if (filters.employmentType)
        query.employmentType = filters.employmentType;
    if (filters.status)
        query.status = filters.status;
    if (filters.keyword) {
        query.$text = { $search: filters.keyword };
    }
    return (0, infinitePaginate_1.infinitePaginate)(job_model_1.default, query, skip, limit, ["addedBy"], "name email role");
});
/* Get Single Job */
const getSingleJobById = (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield job_model_1.default.findById(jobId)
        .populate("addedBy", "name email role");
    if (!job) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Job not found");
    }
    return job;
});
/* Update Job */
const updateJob = (jobId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield job_model_1.default.findById(jobId);
    if (!job) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Job not found");
    }
    // Never allow applications to be overwritten via update
    delete payload.applications;
    delete payload.addedBy;
    // Normalise array fields
    const toArray = (v) => {
        if (v === undefined)
            return undefined;
        if (Array.isArray(v))
            return v;
        if (typeof v === "string") {
            if (v.trim() === "")
                return [];
            return v.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return [];
    };
    const skills = toArray(payload.skills);
    const responsibilities = toArray(payload.responsibilities);
    const qualifications = toArray(payload.qualifications);
    const perks = toArray(payload.perks);
    if (skills !== undefined)
        payload.skills = skills;
    if (responsibilities !== undefined)
        payload.responsibilities = responsibilities;
    if (qualifications !== undefined)
        payload.qualifications = qualifications;
    if (perks !== undefined)
        payload.perks = perks;
    const updated = yield job_model_1.default.findByIdAndUpdate(jobId, payload, {
        new: true,
        runValidators: true,
    });
    return updated;
});
/* Delete Job */
const deleteJob = (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield job_model_1.default.findById(jobId);
    if (!job) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Job not found");
    }
    yield job_model_1.default.findByIdAndDelete(jobId);
    return true;
});
exports.JobServices = {
    addJob,
    getAllJobs,
    getSingleJobById,
    updateJob,
    deleteJob,
};
