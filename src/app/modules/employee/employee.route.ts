import express from "express";
import { EmployeeController } from "./employee.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "../auth/auth.constants";
import { multerUpload } from "../../config/multer.config";

const router = express.Router();

// Add Employee
router.post("/add", auth(UserRole.hr, UserRole.admin), multerUpload.single("file"), EmployeeController.addEmployee);

// Get All
router.get("/", auth(UserRole.hr, UserRole.admin), EmployeeController.getAllEmployees);

router.get("/my-profile", auth(UserRole.employee, UserRole.hr), EmployeeController.getMyProfile);

// Get Single
router.get("/:id", auth(UserRole.hr, UserRole.admin), EmployeeController.getSingleEmployee);

//  Update
router.patch("/update/:id", auth(UserRole.hr, UserRole.admin), multerUpload.single("file"), EmployeeController.updateEmployee);

// Delete
router.delete("/delete/:id", auth(UserRole.hr, UserRole.admin), EmployeeController.deleteEmployee);

export const EmployeeRoutes = router;