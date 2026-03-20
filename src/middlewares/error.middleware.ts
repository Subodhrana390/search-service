import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode: number = err.statusCode || 500;
    let message: string = err.message || "Something went wrong";
    let errors: any[] = err.errors || [];

    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Error";
        errors = err.issues.map((e: any) => ({
            path: e.path.join("."),
            message: e.message,
        }));
    } else if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    } else if (err.name === "MulterError") {
        statusCode = 400;
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File too large";
        } else {
            message = err.message;
        }
    } else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0];
        message = `${field || "Value"} already exists`;
    } else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid or expired token";
    }

    res.status(statusCode).json({
        success: false,
        message,
        errors,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
