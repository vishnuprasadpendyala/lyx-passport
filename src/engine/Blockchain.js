import { Block } from "./Block.js";
import { deepFreeze } from "../utils/deepFreeze.js";

export class Blockchain {
  constructor(difficulty = 1) {
    if (
      !Number.isInteger(difficulty) ||
      difficulty < 1 ||
      difficulty > 6
    ) {
      throw new RangeError(
        "Blockchain difficulty must be an integer between 1 and 6"
      );
    }

    this.difficulty = difficulty;

    const genesisBlock = this.createGenesisBlock();
    deepFreeze(genesisBlock);

    this.chain = [genesisBlock];
  }

  createGenesisBlock() {
    return new Block(
      0,
      0,
      [
        {
          type: "GENESIS",
          message: "Lyx Passport Genesis Block",
        },
      ],
      "0"
    );
  }

    getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data, timestamp = Date.now()) {
    const previousBlock = this.getLatestBlock();

    const block = new Block(
      this.chain.length,
      timestamp,
      structuredClone(data),
      previousBlock.hash
    );

    block.mineBlock(this.difficulty);
    deepFreeze(block);

    this.chain.push(block);

    return block;
  }

  isChainValid() {
    const target = "0".repeat(this.difficulty);

    for (
      let index = 0;
      index < this.chain.length;
      index += 1
    ) {
      const currentBlock = this.chain[index];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (index === 0) {
        if (currentBlock.previousHash !== "0") {
          return false;
        }

        continue;
      }

      const previousBlock = this.chain[index - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (!currentBlock.hash.startsWith(target)) {
        return false;
      }
    }

    return true;
  }
}