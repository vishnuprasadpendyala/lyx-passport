import { createHash } from "node:crypto";
import { stableStringify } from "../utils/stableStringify.js";

export class Block {
  constructor(
    index,
    timestamp,
    data,
    previousHash = ""
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    const blockContent = {
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      nonce: this.nonce,
    };

    return createHash("sha256")
      .update(stableStringify(blockContent))
      .digest("hex");
  }

  mineBlock(difficulty) {
    if (
      !Number.isInteger(difficulty) ||
      difficulty < 1 ||
      difficulty > 6
    ) {
      throw new RangeError(
        "Mining difficulty must be an integer between 1 and 6"
      );
    }

    const target = "0".repeat(difficulty);

    while (!this.hash.startsWith(target)) {
      this.nonce += 1;
      this.hash = this.calculateHash();
    }

    return this;
  }
}