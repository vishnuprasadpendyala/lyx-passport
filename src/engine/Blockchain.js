import { Block } from "./Block.js";
import { deepFreeze } from "../utils/deepFreeze.js";

export class Blockchain {
  constructor(difficulty = 1) {
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 6) {
      throw new RangeError(
        "Blockchain difficulty must be an integer between 1 and 6",
      );
    }

    this.difficulty = difficulty;
    this.pendingTransactions = [];

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
      "0",
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    if (
      transaction === null ||
      typeof transaction !== "object" ||
      Array.isArray(transaction)
    ) {
      throw new TypeError("Transaction must be an object");
    }

    const storedTransaction = structuredClone(transaction);

    deepFreeze(storedTransaction);
    this.pendingTransactions.push(storedTransaction);

    return storedTransaction;
  }

  minePendingTransactions(timestamp = Date.now()) {
    if (this.pendingTransactions.length === 0) {
      throw new Error("There are no pending transactions to mine");
    }

    const block = this.addBlock(this.pendingTransactions, timestamp);

    this.pendingTransactions = [];

    return block;
  }

  getAllTransactions(includePending = false) {
    const minedTransactions = this.chain
      .slice(1)
      .flatMap((block) => block.data);

    if (includePending) {
      return [...minedTransactions, ...this.pendingTransactions];
    }

    return minedTransactions;
  }

  getProductState(serialNumber, includePending = true) {
    let state = null;

    const transactions = this.getAllTransactions(includePending);

    for (const transaction of transactions) {
      if (transaction.serialNumber !== serialNumber) {
        continue;
      }

      if (transaction.action === "REGISTER") {
        state = {
          serialNumber,
          registered: true,
          currentOwner: transaction.toAddress,
        };
      }

      if (transaction.action === "TRANSFER" && state !== null) {
        state = {
          ...state,
          currentOwner: transaction.toAddress,
        };
      }
    }

    return state;
  }

  getProductHistory(serialNumber) {
    const history = [];

    for (const block of this.chain.slice(1)) {
      for (const transaction of block.data) {
        if (transaction.serialNumber === serialNumber) {
          history.push({
            blockIndex: block.index,
            blockHash: block.hash,
            transaction,
          });
        }
      }
    }

    return history;
  }

  addBlock(data, timestamp = Date.now()) {
    const previousBlock = this.getLatestBlock();

    const block = new Block(
      this.chain.length,
      timestamp,
      structuredClone(data),
      previousBlock.hash,
    );

    block.mineBlock(this.difficulty);
    deepFreeze(block);

    this.chain.push(block);

    return block;
  }

  isChainValid() {
    const target = "0".repeat(this.difficulty);

    for (let index = 0; index < this.chain.length; index += 1) {
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
