import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { JobRoutes } from "../modules/job/job.route";
import { ApplicationRoutes } from "../modules/application/application.route";
import { EmployeeRoutes } from "../modules/employee/employee.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/job",
    route: JobRoutes,
  },
  {
    path: "/application",
    route: ApplicationRoutes,
  },
  {
    path: "/employee",
    route: EmployeeRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
