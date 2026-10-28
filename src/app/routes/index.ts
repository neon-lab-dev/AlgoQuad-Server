import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { JobRoutes } from "../modules/job/job.route";
import { ApplicationRoutes } from "../modules/application/application.route";
import { EmployeeRoutes } from "../modules/employee/employee.route";
import { UserRoutes } from "../modules/user/user.route";
import { AdminRoutes } from "../modules/admin/admin.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
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
  {
    path: "/admin",
    route: AdminRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
