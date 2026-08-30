import test from "node:test";
import assert from "node:assert/strict";
import { Block } from "../src/engine/Block.js";
import { Blockchain } from "../src/engine/Blockchain.js";

function createTransaction(serialNumber = "ROLEX-1") {
  return {
    serialNumber,
    action: "REGISTER",
    fromAddress: null,
    toAddress: "0xManufacturer",
    timestamp: 1787954400000,
  };
}

test("creates a blockchain with a genesis block", () => {
  const blockchain = new Blockchain(1);

  assert.equal(blockchain.chain.length, 1);

  const genesis = blockchain.chain[0];

  assert.equal(genesis.index, 0);
  assert.equal(genesis.timestamp, 0);
  assert.equal(genesis.previousHash, "0");
  assert.equal(genesis.data[0].type, "GENESIS");
  assert.equal(
    genesis.data[0].message,
    "Lyx Passport Genesis Block"
  );
});

test("returns the genesis block as the latest block", () => {
  const blockchain = new Blockchain(1);

  assert.equal(
    blockchain.getLatestBlock(),
    blockchain.chain[0]
  );
});

test("freezes the genesis block and its nested data", () => {
  const blockchain = new Blockchain(1);
  const genesis = blockchain.getLatestBlock();

  assert.equal(Object.isFrozen(genesis), true);
  assert.equal(Object.isFrozen(genesis.data), true);
  assert.equal(Object.isFrozen(genesis.data[0]), true);
});

test("rejects invalid blockchain difficulties", () => {
  const invalidDifficulties = [
    0,
    -1,
    1.5,
    7,
    "2",
    null,
  ];

  for (const difficulty of invalidDifficulties) {
    assert.throws(
      () => new Blockchain(difficulty),
      /difficulty must be an integer between 1 and 6/i
    );
  }
});

test("adds and returns a mined block", () => {
  const blockchain = new Blockchain(1);

  const block = blockchain.addBlock(
    [createTransaction()],
    1787954400000
  );

  assert.equal(blockchain.chain.length, 2);
  assert.equal(blockchain.getLatestBlock(), block);
  assert.equal(block.index, 1);
  assert.ok(block.hash.startsWith("0"));
});

test("links a new block to the previous block", () => {
  const blockchain = new Blockchain(1);
  const genesisHash = blockchain.getLatestBlock().hash;

  const block = blockchain.addBlock(
    [createTransaction()],
    1787954400000
  );

  assert.equal(block.previousHash, genesisHash);
});

test("freezes mined blocks and their nested data", () => {
  const blockchain = new Blockchain(1);

  const block = blockchain.addBlock(
    [createTransaction()],
    1787954400000
  );

  assert.equal(Object.isFrozen(block), true);
  assert.equal(Object.isFrozen(block.data), true);
  assert.equal(Object.isFrozen(block.data[0]), true);

  assert.throws(() => {
    block.data[0].toAddress = "0xCounterfeiter";
  }, TypeError);
});

test("does not freeze the caller's original data", () => {
  const blockchain = new Blockchain(1);
  const data = [createTransaction()];

  blockchain.addBlock(data, 1787954400000);

  assert.equal(Object.isFrozen(data), false);
  assert.equal(Object.isFrozen(data[0]), false);

  data[0].toAddress = "0xAlice";

  assert.equal(data[0].toAddress, "0xAlice");
  assert.equal(
    blockchain.chain[1].data[0].toAddress,
    "0xManufacturer"
  );
});

test("recognizes a valid blockchain", () => {
  const blockchain = new Blockchain(1);

  blockchain.addBlock(
    [createTransaction("ROLEX-1")],
    1787954400000
  );

  blockchain.addBlock(
    [createTransaction("ROLEX-2")],
    1787954500000
  );

  assert.equal(blockchain.isChainValid(), true);
});

test("detects tampered block data", () => {
  const blockchain = new Blockchain(1);

  blockchain.addBlock(
    [createTransaction()],
    1787954400000
  );

  const original = blockchain.chain[1];

  const tampered = new Block(
    original.index,
    original.timestamp,
    structuredClone(original.data),
    original.previousHash
  );

  tampered.nonce = original.nonce;
  tampered.hash = original.hash;
  tampered.data[0].toAddress = "0xCounterfeiter";

  blockchain.chain[1] = tampered;

  assert.equal(blockchain.isChainValid(), false);
});

test("detects an invalid previous hash", () => {
  const blockchain = new Blockchain(1);

  blockchain.addBlock(
    [createTransaction()],
    1787954400000
  );

  const original = blockchain.chain[1];

  const incorrectlyLinked = new Block(
    original.index,
    original.timestamp,
    structuredClone(original.data),
    "incorrect-previous-hash"
  );

  incorrectlyLinked.mineBlock(1);
  blockchain.chain[1] = incorrectlyLinked;

  assert.equal(blockchain.isChainValid(), false);
});

test("detects a block without valid Proof-of-Work", () => {
  const blockchain = new Blockchain(2);

  const unminedBlock = new Block(
    1,
    1787954400000,
    [createTransaction()],
    blockchain.getLatestBlock().hash
  );

  while (unminedBlock.hash.startsWith("00")) {
    unminedBlock.nonce += 1;
    unminedBlock.hash = unminedBlock.calculateHash();
  }

  blockchain.chain.push(unminedBlock);

  assert.equal(blockchain.isChainValid(), false);
});