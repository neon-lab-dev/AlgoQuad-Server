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
exports.AdminService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const job_model_1 = __importDefault(require("../job/job.model"));
const application_model_1 = __importDefault(require("../application/application.model"));
const getAdminStats = () => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Get Job Stats
    const activeJobOpenings = yield job_model_1.default.countDocuments({ status: "Active" });
    // 2. Get Candidate Stats using Aggregation (Fast & Efficient)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const candidateStats = yield application_model_1.default.aggregate([
        {
            $facet: {
                // Total Candidates
                totalCandidates: [{ $count: "count" }],
                // New Candidates this week
                newThisWeek: [
                    { $match: { createdAt: { $gte: oneWeekAgo } } },
                    { $count: "count" },
                ],
                // Pending Actions (e.g., New + Screening)
                pendingActions: [
                    { $match: { status: { $in: ["New", "Screening"] } } },
                    { $count: "count" },
                ],
                // Status Breakdown
                statusSummary: [
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                ],
            },
        },
    ]);
    // Helper to extract counts safely
    const getCount = (arr) => (arr[0] ? arr[0].count : 0);
    // Format the status breakdown into an object
    const rawStatus = candidateStats[0].statusSummary;
    const statusObj = {
        New: 0,
        Screening: 0,
        Interview: 0,
        Selected: 0,
        Rejected: 0,
        Hired: 0,
    };
    rawStatus.forEach((item) => {
        if (statusObj[item._id] !== undefined) {
            statusObj[item._id] = item.count;
        }
    });
    return {
        activeJobOpenings,
        totalCandidates: getCount(candidateStats[0].totalCandidates),
        newThisWeek: getCount(candidateStats[0].newThisWeek),
        pendingActions: getCount(candidateStats[0].pendingActions),
        statusSummary: statusObj,
    };
});
exports.AdminService = {
    getAdminStats,
};
