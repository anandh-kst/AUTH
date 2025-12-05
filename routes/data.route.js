import express from "express";
import dataController from "../controllers/data.controller.js";
const dataRouter = express.Router();

dataRouter.get("/bloodGroups", dataController.getBloodGroups);

export default dataRouter;