import test from "node:test";
import assert from "node:assert/strict";
import { deepFreeze } from "../src/utils/deepFreeze.js";

test("deeply freezes an object", () => {
  const value = {
    product: {
      serialNumber: "ROLEX-1",
      owner: "Alice",
    },
  };

  deepFreeze(value);

  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.product), true);
});

test("prevents mutation of frozen nested data", () => {
  const value = {
    product: {
      owner: "Alice",
    },
  };

  deepFreeze(value);

  assert.throws(() => {
    value.product.owner = "Bob";
  }, TypeError);
});