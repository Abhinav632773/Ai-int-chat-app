import { Router } from "express";
import { body } from "express-validator";
import * as projectController from "../controllers/project.controller.js";
import * as authMiddleWare from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authMiddleWare.authUser,
  body("name").isString().withMessage("Name is required"),
  projectController.createProject
);

router.get(
  "/all",
  authMiddleWare.authUser,
  projectController.getAllProjects
);

router.put(
  "/add-user",
  authMiddleWare.authUser,
  body("projectId").isMongoId().withMessage("Invalid Project ID"),
  body("users").isArray({ min: 1 }).withMessage("Users must be an array of ObjectIds"),
  body("users.*").isMongoId().withMessage("Each user ID must be a valid Mongo ObjectId"),
  projectController.addUsersToProject
);

router.get(
  "/get-project/:projectId",
  authMiddleWare.authUser,
  projectController.getProjectById
);

router.put('/update-file-tree',
  authMiddleWare.authUser,
  body('projectId').isString().withMessage('Project ID is required'),
  body('fileTree').isObject().withMessage('File tree is required'),
  projectController.updateFileTree
)

export default router;
