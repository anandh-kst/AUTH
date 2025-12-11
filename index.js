import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import dataRouter from "./routes/data.route.js";
import { setupSwagger } from "./swagger.js";

dotenv.config();

const app = express();

// Swagger only runs locally
setupSwagger(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRouter);
app.use("/api/data", dataRouter);

app.get("/", (req, res) => {
  res.send("Health App Server is running");
});

const PORT = process.env.PORT || 3002;

mongoose
  .connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log("DB Connection Successful");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.log(err));
