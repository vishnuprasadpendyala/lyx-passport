import test from "node:test";
import assert from "node:assert/strict";
import { stableStringify } from "../src/utils/stableStringify.js";

test("serializes objects deterministically", () => {
  const first = {
    serialNumber: "ROLEX-1",
    owner: "Alice",
  };

  const second = {
    owner: "Alice",
    serialNumber: "ROLEX-1",
  };

  assert.equal(
    stableStringify(first),
    stableStringify(second)
  );
});

test("sorts keys in nested objects", () => {
  const first = {
    product: {
      serialNumber: "ROLEX-1",
      owner: "Alice",
    },
    action: "REGISTER",
  };

  const second = {
    action: "REGISTER",
    product: {
      owner: "Alice",
      serialNumber: "ROLEX-1",
    },
  };

  assert.equal(
    stableStringify(first),
    stableStringify(second)
  );
});

test("preserves array order", () => {
  assert.notEqual(
    stableStringify(["REGISTER", "TRANSFER"]),
    stableStringify(["TRANSFER", "REGISTER"])
  );
});

test("rejects circular structures", () => {
  const value = {};
  value.self = value;

  assert.throws(
    () => stableStringify(value),
    /circular structure/
  );
});