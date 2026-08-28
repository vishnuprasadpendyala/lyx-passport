import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../src/app.js";

test("GET /health returns an OK response", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const address = server.address();
  const response = await fetch(
    `http://127.0.0.1:${address.port}/health`
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
  });
});