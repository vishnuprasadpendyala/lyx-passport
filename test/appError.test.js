import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../src/errors/AppError.js";

test("creates an application error with a status code", () => {
  const error = new AppError(
    "Product was not found",
    404
  );

  assert.equal(error.message, "Product was not found");
  assert.equal(error.statusCode, 404);
  assert.equal(error.name, "AppError");
  assert.equal(error instanceof Error, true);
});

test("captures a stack trace", () => {
  const error = new AppError(
    "Invalid transaction",
    400
  );

  assert.equal(typeof error.stack, "string");
  assert.match(error.stack, /Invalid transaction/);
});