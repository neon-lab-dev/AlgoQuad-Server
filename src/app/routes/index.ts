import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { JobRoutes } from "../modules/job/job.route";
import { ApplicationRoutes } from "../modules/application/application.route";

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
