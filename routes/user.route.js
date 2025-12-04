import express from "express";

import userController from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/register",userController.register );
userRouter.post("/sendOtp",userController.sendOtp);
userRouter.post("/verifyOtp",userController.verifyOtp);


export default userRouter;
