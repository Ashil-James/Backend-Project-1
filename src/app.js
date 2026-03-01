import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import path from "path";
import fs from "fs";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

// Add this to log every request
app.use((req, res, next) => {
  const logFile = path.join(process.cwd(), "debug.log");
  fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

//routes import

import userRouter from "./routes/user.routes.js";

//routes declaration
app.use("/api/v1/user", userRouter);

// Global error handler — MUST be after all routes
app.use((err, req, res, next) => {
  console.error("--- ERROR ---");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };
