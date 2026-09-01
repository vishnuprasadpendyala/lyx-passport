import { Blockchain } from "../engine/Blockchain.js";
import { config } from "../config/config.js";

export const blockchain = new Blockchain(
  config.powDifficulty
);