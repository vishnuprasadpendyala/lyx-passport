import test from "node:test";
import assert from "node:assert/strict";
import { Block } from "../src/engine/Block.js";

const timestamp = 1787954400000;

function createRegistrationData() {
  return [
    {
      serialNumber: "ROLEX-SUB-9981",
      action: "REGISTER",
      fromAddress: null,
      toAddress: "0xManufacturer",
      timestamp,
    },
  ];
}

test("creates a block with the expected properties", () => {
  const block = new Block(
    1,
    timestamp,
    createRegistrationData(),
    "previous-hash"
  );

  assert.equal(block.index, 1);
  assert.equal(block.timestamp, timestamp);
  assert.deepEqual(block.data, createRegistrationData());
  assert.equal(block.previousHash, "previous-hash");
  assert.equal(block.nonce, 0);
  assert.equal(typeof block.hash, "string");
  assert.equal(block.hash.length, 64);
});

test("produces the same hash for the same content", () => {
  const first = new Block(
    1,
    timestamp,
    createRegistrationData(),
    "previous-hash"
  );

  const second = new Block(
    1,
    timestamp,
    createRegistrationData(),
    "previous-hash"
  );

  assert.equal(first.hash, second.hash);
});

test("produces a different hash when data changes", () => {
  const first = new Block(
    1,
    timestamp,
    createRegistrationData(),
    "previous-hash"
  );

  const changedData = createRegistrationData();
  changedData[0].toAddress = "0xAlice";

  const second = new Block(
    1,
    timestamp,
    changedData,
    "previous-hash"
  );

  assert.notEqual(first.hash, second.hash);
});

test("produces a different hash when nonce changes", () => {
  const block = new Block(
    1,
    timestamp,
    createRegistrationData(),
    "previous-hash"
  );

  const originalHash = block.hash;

  block.nonce = 1;
  const changedHash = block.calculateHash();

  assert.notEqual(originalHash, changedHash);
});

test("ignores object key insertion order when hashing", () => {
  const firstData = [
    {
      serialNumber: "ROLEX-SUB-9981",
      action: "REGISTER",
      fromAddress: null,
      toAddress: "0xManufacturer",
      timestamp,
    },
  ];

  const secondData = [
    {
      timestamp,
      toAddress: "0xManufacturer",
      fromAddress: null,
      action: "REGISTER",
      serialNumber: "ROLEX-SUB-9981",
    },
  ];

  const first = new Block(
    1,
    timestamp,
    firstData,
    "previous-hash"
  );

  const second = new Block(
    1,
    timestamp,
    secondData,
    "previous-hash"
  );

  assert.equal(first.hash, second.hash);
});