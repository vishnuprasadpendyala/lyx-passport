import test from "node:test";
import assert from "node:assert/strict";
import { Blockchain } from "../src/engine/Blockchain.js";

function createRegistration(overrides = {}) {
  return {
    serialNumber: "ROLEX-SUB-9981",
    action: "REGISTER",
    fromAddress: null,
    toAddress: "0xManufacturer",
    timestamp: 1787954400000,
    ...overrides,
  };
}

test("normalizes transaction string fields", () => {
  const blockchain = new Blockchain(1);

  const transaction = blockchain.addTransaction(
    createRegistration({
      serialNumber: "  ROLEX-SUB-9981  ",
      toAddress: "  0xManufacturer  ",
    }),
  );

  assert.equal(transaction.serialNumber, "ROLEX-SUB-9981");

  assert.equal(transaction.toAddress, "0xManufacturer");
});

test("rejects a missing serial number", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () => blockchain.addTransaction(createRegistration({ serialNumber: "" })),
    /serialNumber is required/,
  );
});

test("rejects an unsupported action", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () => blockchain.addTransaction(createRegistration({ action: "SELL" })),
    /action must be REGISTER or TRANSFER/,
  );
});

test("rejects a missing destination address", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () => blockchain.addTransaction(createRegistration({ toAddress: "" })),
    /toAddress is required/,
  );
});

test("rejects an invalid timestamp", () => {
  const blockchain = new Blockchain(1);

  for (const timestamp of [undefined, null, 0, -1, 1.5, "1787954400000"]) {
    assert.throws(
      () => blockchain.addTransaction(createRegistration({ timestamp })),
      /timestamp must be a positive integer/,
    );
  }
});

test("requires a source address for transfers", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () =>
      blockchain.addTransaction({
        serialNumber: "ROLEX-SUB-9981",
        action: "TRANSFER",
        fromAddress: null,
        toAddress: "0xAlice",
        timestamp: 1787954600000,
      }),
    /fromAddress is required for TRANSFER/,
  );
});

test("rejects an invalid source address type", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () => blockchain.addTransaction(createRegistration({ fromAddress: 123 })),
    /fromAddress must be null or a non-empty string/,
  );
});

test("rejects duplicate registration", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());

  assert.throws(
    () => blockchain.addTransaction(createRegistration()),
    /already registered/,
  );
});

test("requires REGISTER to have a null source address", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () =>
      blockchain.addTransaction(
        createRegistration({
          fromAddress: "0xManufacturer",
        }),
      ),
    /REGISTER transaction must have fromAddress = null/,
  );
});

test("rejects transfer of an unknown product", () => {
  const blockchain = new Blockchain(1);

  assert.throws(
    () =>
      blockchain.addTransaction({
        serialNumber: "UNKNOWN-1",
        action: "TRANSFER",
        fromAddress: "0xManufacturer",
        toAddress: "0xAlice",
        timestamp: 1787954600000,
      }),
    /does not exist/,
  );
});

test("rejects transfer from a non-owner", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  assert.throws(
    () =>
      blockchain.addTransaction({
        serialNumber: "ROLEX-SUB-9981",
        action: "TRANSFER",
        fromAddress: "0xKen",
        toAddress: "0xAlice",
        timestamp: 1787954600000,
      }),
    /not the current owner/,
  );
});

test("rejects transfer to the current owner", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  assert.throws(
    () =>
      blockchain.addTransaction({
        serialNumber: "ROLEX-SUB-9981",
        action: "TRANSFER",
        fromAddress: "0xManufacturer",
        toAddress: "0xManufacturer",
        timestamp: 1787954600000,
      }),
    /cannot be identical/,
  );
});

test("allows the current owner to transfer a product", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  const transfer = blockchain.addTransaction({
    serialNumber: "ROLEX-SUB-9981",
    action: "TRANSFER",
    fromAddress: "0xManufacturer",
    toAddress: "0xAlice",
    timestamp: 1787954600000,
  });

  assert.equal(transfer.action, "TRANSFER");
  assert.equal(transfer.fromAddress, "0xManufacturer");
  assert.equal(transfer.toAddress, "0xAlice");
  assert.equal(blockchain.pendingTransactions.length, 1);
});

test("rejects conflicting pending transfers", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  blockchain.addTransaction({
    serialNumber: "ROLEX-SUB-9981",
    action: "TRANSFER",
    fromAddress: "0xManufacturer",
    toAddress: "0xAlice",
    timestamp: 1787954600000,
  });

  assert.throws(
    () =>
      blockchain.addTransaction({
        serialNumber: "ROLEX-SUB-9981",
        action: "TRANSFER",
        fromAddress: "0xManufacturer",
        toAddress: "0xBob",
        timestamp: 1787954700000,
      }),
    /not the current owner/,
  );
});

test("accepts a valid mined state history", () => {
  const blockchain = new Blockchain(1);

  blockchain.addTransaction(createRegistration());
  blockchain.minePendingTransactions(1787954500000);

  blockchain.addTransaction({
    serialNumber: "ROLEX-SUB-9981",
    action: "TRANSFER",
    fromAddress: "0xManufacturer",
    toAddress: "0xAlice",
    timestamp: 1787954600000,
  });

  blockchain.minePendingTransactions(1787954700000);

  assert.equal(blockchain.isStateHistoryValid(), true);
  assert.equal(blockchain.isChainValid(), true);
});

test("detects duplicate registration in mined history", () => {
  const blockchain = new Blockchain(1);

  blockchain.addBlock([createRegistration()], 1787954500000);

  blockchain.addBlock(
    [
      createRegistration({
        toAddress: "0xCounterfeiter",
        timestamp: 1787954600000,
      }),
    ],
    1787954700000,
  );

  assert.equal(blockchain.isStateHistoryValid(), false);
  assert.equal(blockchain.isChainValid(), false);
});

test("detects unauthorized transfer in mined history", () => {
  const blockchain = new Blockchain(1);

  blockchain.addBlock([createRegistration()], 1787954500000);

  blockchain.addBlock(
    [
      {
        serialNumber: "ROLEX-SUB-9981",
        action: "TRANSFER",
        fromAddress: "0xKen",
        toAddress: "0xAlice",
        timestamp: 1787954600000,
      },
    ],
    1787954700000,
  );

  assert.equal(blockchain.isStateHistoryValid(), false);
  assert.equal(blockchain.isChainValid(), false);
});
