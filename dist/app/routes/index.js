"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const job_route_1 = require("../modules/job/job.route");
const application_route_1 = require("../modules/application/application.route");
const employee_route_1 = require("../modules/employee/employee.route");
const user_route_1 = require("../modules/user/user.route");
const admin_route_1 = require("../modules/admin/admin.route");
const timesheet_route_1 = require("../modules/timesheet/timesheet.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes,
    },
    {
        path: "/user",
        route: user_route_1.UserRoutes,
    },
    {
        path: "/job",
        route: job_route_1.JobRoutes,
    },
    {
        path: "/application",
        route: application_route_1.ApplicationRoutes,
    },
    {
        path: "/employee",
        route: employee_route_1.EmployeeRoutes,
    },
    {
        path: "/admin",
        route: admin_route_1.AdminRoutes,
    },
    {
        path: "/timesheet",
        route: timesheet_route_1.TimesheetRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
