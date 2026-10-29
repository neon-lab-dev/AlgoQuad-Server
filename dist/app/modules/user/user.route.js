"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_constants_1 = require("../auth/auth.constants");
const user_controller_1 = require("./user.controller");
const router = express_1.default.Router();
router.get("/me", (0, auth_1.default)(auth_constants_1.UserRole.hr, auth_constants_1.UserRole.admin, auth_constants_1.UserRole.employee), user_controller_1.UserController.getMyProfile);
exports.UserRoutes = router;
