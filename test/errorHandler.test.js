import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middleware/errorHandler.js";

test("hides unexpected internal error details", () => {
  const response = {
    headersSent: false,
    statusCode: null,
    body: null,

    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },

    json(body) {
      this.body = body;
      return this;
    },
  };

  errorHandler(
    new Error("Sensitive implementation detail"),
    {},
    response,
    () => {}
  );

  assert.equal(response.statusCode, 500);
  assert.equal(
    response.body.message,
    "Internal server error"
  );
});