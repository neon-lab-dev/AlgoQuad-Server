import express from "express";
import { TimesheetController } from "./timesheet.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";

const router = express.Router();

router.get("/my", auth(UserRole.employee), TimesheetController.getMyTimesheet);

router.post("/add-hours", auth(UserRole.employee), TimesheetController.addWorkingHours);

router.get(
  "/employee/:employeeId",
  auth(UserRole.hr, UserRole.admin),
  TimesheetController.getTimesheetOfAnEmployee
);

export const TimesheetRoutes = router;