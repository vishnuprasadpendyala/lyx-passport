import express from "express";
import { blockchainRouter } from "./routes/blockchainRoutes.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api", blockchainRouter);

app.use(notFound);
app.use(errorHandler);
