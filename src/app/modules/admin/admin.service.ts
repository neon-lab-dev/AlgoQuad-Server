/* eslint-disable @typescript-eslint/no-explicit-any */
import Job from "../job/job.model";
import Application from "../application/application.model";

const getAdminStats = async () => {
  // 1. Get Job Stats
  const activeJobOpenings = await Job.countDocuments({ status: "Active" });

  // 2. Get Candidate Stats using Aggregation (Fast & Efficient)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const candidateStats = await Application.aggregate([
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
  const getCount = (arr: { count: number }[]) => (arr[0] ? arr[0].count : 0);

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
  
  rawStatus.forEach((item: any) => {
    if (statusObj[item._id as keyof typeof statusObj] !== undefined) {
      statusObj[item._id as keyof typeof statusObj] = item.count;
    }
  });

  return {
    activeJobOpenings,
    totalCandidates: getCount(candidateStats[0].totalCandidates),
    newThisWeek: getCount(candidateStats[0].newThisWeek),
    pendingActions: getCount(candidateStats[0].pendingActions),
    statusSummary: statusObj,
  };
};

export const AdminService = {
  getAdminStats,
};