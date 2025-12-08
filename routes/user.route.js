import express from "express";
import userController from "../controllers/user.controller.js";
import upload from "../utils/multer-helper.js";

const userRouter = express.Router();

userRouter.post("/register", upload.single("file"), userController.register);
userRouter.post("/sendOtp", userController.sendOtp);
userRouter.post("/verifyOtp", userController.verifyOtp);
userRouter.post("/login", userController.login);
userRouter.post("/forgotPassword", userController.forgotPassword);
userRouter.get("/getUser", userController.getUser);

export default userRouter;
