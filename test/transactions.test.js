import test from "node:test";
import assert from "node:assert/strict";
import { Blockchain } from "../src/engine/Blockchain.js";

function createRegistration() {
  return {
    serialNumber: "ROLEX-SUB-9981",
    action: "REGISTER",
    fromAddress: null,
    toAddress: "0xManufacturer",
    timestamp: 1787954400000,
  };
}

function createTransfer() {
  return {
    serialNumber: "ROLEX-SUB-9981",
    action: "TRANSFER",
    fromAddress: "0xManufacturer",
    toAddress: "0xAlice",
    timestamp: 1787954600000,
  };
}

test("starts with an empty pending transaction pool", () => {
  const blockchain = new Blockchain(1);

  assert.deepEqual(blockchain.pendingTransactions, []);
});

test("adds a transaction to the pending pool", () => {
  const blockchain = new Blockchain(1);
  const transaction = createRegistration();

  const storedTransaction = blockchain.addTransaction(transaction);

  assert.equal(blockchain.pendingTransactions.length, 1);
  assert.equal(blockchain.pendingTransactions[0], storedTransaction);

  assert.deepEqual(storedTransaction, transaction);
});

test("stores a frozen copy of the transaction", () => {
  const blockchain = new Blockchain(1);
  const original = createRegistration();

  const stored = blockchain.addTransaction(original);

  assert.notEqual(stored, original);
  assert.equal(Object.isFrozen(stored), true);
  assert.equal(Object.isFrozen(original), false);

  original.toAddress = "0xAlice";

  assert.equal(original.toAddress, "0xAlice");
  assert.equal(stored.toAddress, "0xManufacturer");

  assert.throws(() => {
    stored.toAddress = "0xCounterfeiter";
  }, TypeError);
});

test("rejects values that are not transaction objects", () => {
  const blockchain = new Blockchain(1);

  for (const invalidValue of [null, "transaction", 123, []]) {
    assert.throws(
      () => blockchain.addTransaction(invalidValue),
      /transaction must be an object/i,
    );
  }
});

test("mines pending transactions into a block", () => {
  const blockchain = new Blockchain(1);
  const transaction = createRegistration();

  blockchain.addTransaction(transaction);

  const block = blockchain.minePendingTransactions(1787954500000);

  assert.equal(blockchain.chain.length, 2);
  assert.equal(block.data.length, 1);
  assert.deepEqual(block.data[0], transaction);
  assert.ok(block.hash.startsWith("0"));
});

test("clears pending transactions after mining", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  assert.deepEqual(blockchain.pendingTransactions, []);
});

test("rejects mining when there are no pending transactions", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () => blockchain.minePendingTransactions(),
    /no pending transactions to mine/i,
  );
});

test("returns all mined transactions", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  blockchain.addTransaction(createTransfer());
  blockchain.minePendingTransactions(1787954700000);

  const transactions = blockchain.getAllTransactions();

  assert.equal(transactions.length, 2);
  assert.equal(transactions[0].action, "REGISTER");
  assert.equal(transactions[1].action, "TRANSFER");
});

test("derives the registered product owner", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  const state = blockchain.getProductState("ROLEX-SUB-9981", false);

  assert.deepEqual(state, {
    serialNumber: "ROLEX-SUB-9981",
    registered: true,
    currentOwner: "0xManufacturer",
  });
});

test("derives ownership after a transfer", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  blockchain.addTransaction(createTransfer());
  blockchain.minePendingTransactions(1787954700000);

  const state = blockchain.getProductState("ROLEX-SUB-9981", false);

  assert.equal(state.currentOwner, "0xAlice");
});

test("includes pending transactions in effective state", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());

  const effectiveState = blockchain.getProductState("ROLEX-SUB-9981");

  const minedState = blockchain.getProductState("ROLEX-SUB-9981", false);

  assert.equal(effectiveState.currentOwner, "0xManufacturer");

  assert.equal(minedState, null);
});

test("returns the complete mined product history", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  blockchain.addTransaction(createTransfer());
  blockchain.minePendingTransactions(1787954700000);

  const history = blockchain.getProductHistory("ROLEX-SUB-9981");

  assert.equal(history.length, 2);
  assert.equal(history[0].blockIndex, 1);
  assert.equal(history[0].transaction.action, "REGISTER");
  assert.equal(history[1].blockIndex, 2);
  assert.equal(history[1].transaction.action, "TRANSFER");
});
