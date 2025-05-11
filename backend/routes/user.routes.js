import { Router } from "express";
import { body } from "express-validator";
import * as userController from "../controllers/user.controller.js";
import * as authMiddleware from "../middleware/auth.middleware.js";
import { getUserIdsByEmails } from "../controllers/user.controller.js";
const router = Router();

// ✅ User Registration Route
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email must be a valid email address"),
    body("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters long"),
  ],
  userController.createUserController
);

// ✅ User Login Route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email must be a valid email address"),
    body("password").isLength({ min: 3 }).withMessage("Password must be at least 3 characters long"),
  ],
  userController.loginController
);

// ✅ User Profile Route (Protected)
router.get("/profile", authMiddleware.authUser, userController.profileController);

// ✅ User Logout Route (Protected)
router.get("/logout", authMiddleware.authUser, userController.logoutController);

router.get('/all',authMiddleware.authUser,userController.getAllUsersController)

router.post("/get-ids",getUserIdsByEmails)

router.post("/get-emails", userController.getEmailsByUserIds);

export default router;
