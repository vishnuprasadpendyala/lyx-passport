import test from "node:test";
import assert from "node:assert/strict";
import { Blockchain } from "../src/engine/Blockchain.js";
import { blockchain } from "../src/services/blockchainService.js";
import { config } from "../src/config/config.js";

test("exports a configured blockchain instance", () => {
  assert.equal(blockchain instanceof Blockchain, true);
  assert.equal(
    blockchain.difficulty,
    config.powDifficulty
  );
  assert.equal(blockchain.chain.length, 1);
});