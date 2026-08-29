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
}