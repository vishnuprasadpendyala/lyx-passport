import { Router } from "express";
import {
  createTransaction,
  getChain,
  mineTransactions,
  verifyProduct,
} from "../controllers/blockchainController.js";

export const blockchainRouter = Router();

blockchainRouter.get("/chain", getChain);

blockchainRouter.post(
  "/transactions",
  createTransaction
);

blockchainRouter.post("/mine", mineTransactions);

blockchainRouter.get(
  "/verify/:id",
  verifyProduct
);