import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import discoveryRoutes from "./routes/discovery.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app: Application = express();

app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/**
 * Health check route
 */
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        service: "discovery-service",
        status: "UP",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/v1/discovery", discoveryRoutes);

app.use(errorMiddleware);

export default app;