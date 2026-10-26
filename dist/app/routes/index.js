"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("../modules/auth/auth.route");
const job_route_1 = require("../modules/job/job.route");
const application_route_1 = require("../modules/application/application.route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes,
    },
    {
        path: "/job",
        route: job_route_1.JobRoutes,
    },
    {
        path: "/application",
        route: application_route_1.ApplicationRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
