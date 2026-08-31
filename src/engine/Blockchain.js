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
  normalizeTransaction(input) {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("Transaction must be an object");
    }

    const {
      serialNumber,
      action,
      fromAddress = null,
      toAddress,
      timestamp,
    } = input;

    if (typeof serialNumber !== "string" || !serialNumber.trim()) {
      throw new TypeError("serialNumber is required");
    }

    if (!["REGISTER", "TRANSFER"].includes(action)) {
      throw new TypeError("action must be REGISTER or TRANSFER");
    }

    if (typeof toAddress !== "string" || !toAddress.trim()) {
      throw new TypeError("toAddress is required");
    }

    if (!Number.isInteger(timestamp) || timestamp <= 0) {
      throw new TypeError("timestamp must be a positive integer");
    }

    let normalizedFromAddress = null;

    if (fromAddress !== null) {
      if (typeof fromAddress !== "string" || !fromAddress.trim()) {
        throw new TypeError("fromAddress must be null or a non-empty string");
      }

      normalizedFromAddress = fromAddress.trim();
    }

    if (action === "TRANSFER" && normalizedFromAddress === null) {
      throw new TypeError("fromAddress is required for TRANSFER");
    }

    return {
      serialNumber: serialNumber.trim(),
      action,
      fromAddress: normalizedFromAddress,
      toAddress: toAddress.trim(),
      timestamp,
    };
  }

  validateStateTransition(transaction) {
    const state = this.getProductState(transaction.serialNumber, true);

    if (transaction.action === "REGISTER") {
      if (state !== null) {
        throw new Error(
          `Product ${transaction.serialNumber} is already registered`,
        );
      }

      if (transaction.fromAddress !== null) {
        throw new Error("REGISTER transaction must have fromAddress = null");
      }

      return true;
    }

    if (state === null) {
      throw new Error(`Product ${transaction.serialNumber} does not exist`);
    }

    if (state.currentOwner !== transaction.fromAddress) {
      throw new Error(
        `Transfer rejected. ${transaction.fromAddress} is not the current owner`,
      );
    }

    if (transaction.fromAddress === transaction.toAddress) {
      throw new Error("fromAddress and toAddress cannot be identical");
    }

    return true;
  }

  addTransaction(input) {
    const transaction = this.normalizeTransaction(input);

    this.validateStateTransition(transaction);

    deepFreeze(transaction);
    this.pendingTransactions.push(transaction);

    return transaction;
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

  isStateHistoryValid() {
    const owners = new Map();

    for (const block of this.chain.slice(1)) {
      for (const rawTransaction of block.data) {
        let transaction;

        try {
          transaction = this.normalizeTransaction(rawTransaction);
        } catch {
          return false;
        }

        if (transaction.action === "REGISTER") {
          if (
            owners.has(transaction.serialNumber) ||
            transaction.fromAddress !== null
          ) {
            return false;
          }

          owners.set(transaction.serialNumber, transaction.toAddress);

          continue;
        }

        if (
          !owners.has(transaction.serialNumber) ||
          owners.get(transaction.serialNumber) !== transaction.fromAddress ||
          transaction.fromAddress === transaction.toAddress
        ) {
          return false;
        }

        owners.set(transaction.serialNumber, transaction.toAddress);
      }
    }

    return true;
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

    return this.isStateHistoryValid();
  }
}
