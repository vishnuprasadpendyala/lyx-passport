import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../src/app.js";

test("GET /api/chain returns the ledger", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const { port } = server.address();

  const response = await fetch(
    `http://127.0.0.1:${port}/api/chain`
  );

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 1);
  assert.equal(body.chainValid, true);
  assert.deepEqual(body.pendingTransactions, []);
  assert.equal(body.chain[0].index, 0);
});

test("returns 404 for an unknown route", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const { port } = server.address();

  const response = await fetch(
    `http://127.0.0.1:${port}/api/unknown`
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.status, "error");
  assert.equal(body.statusCode, 404);
  assert.match(body.message, /was not found/);
});

test("returns 400 for a malformed transaction", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const { port } = server.address();

  const response = await fetch(
    `http://127.0.0.1:${port}/api/transactions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "REGISTER",
      }),
    }
  );

  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.statusCode, 400);
  assert.match(body.message, /serialNumber is required/);
});

test("returns 422 when mining an empty pool", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const { port } = server.address();

  const response = await fetch(
    `http://127.0.0.1:${port}/api/mine`,
    {
      method: "POST",
    }
  );

  const body = await response.json();

  assert.equal(response.status, 422);
  assert.equal(body.statusCode, 422);
  assert.match(
    body.message,
    /no pending transactions to mine/i
  );
});

test("completes the product ownership API workflow", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const registrationResponse = await fetch(
    `${baseUrl}/api/transactions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        serialNumber: "API-ROLEX-001",
        action: "REGISTER",
        fromAddress: null,
        toAddress: "0xManufacturer",
        timestamp: 1787954400000,
      }),
    }
  );

  assert.equal(registrationResponse.status, 201);

  const registrationBody =
    await registrationResponse.json();

  assert.equal(
    registrationBody.transaction.action,
    "REGISTER"
  );

  const firstMiningResponse = await fetch(
    `${baseUrl}/api/mine`,
    {
      method: "POST",
    }
  );

  assert.equal(firstMiningResponse.status, 201);

  const firstVerificationResponse = await fetch(
    `${baseUrl}/api/verify/API-ROLEX-001`
  );

  assert.equal(firstVerificationResponse.status, 200);

  const firstVerification =
    await firstVerificationResponse.json();

  assert.equal(
    firstVerification.currentOwner,
    "0xManufacturer"
  );

  assert.equal(firstVerification.history.length, 1);
  assert.equal(firstVerification.verified, true);

  const transferResponse = await fetch(
    `${baseUrl}/api/transactions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        serialNumber: "API-ROLEX-001",
        action: "TRANSFER",
        fromAddress: "0xManufacturer",
        toAddress: "0xAlice",
        timestamp: 1787954600000,
      }),
    }
  );

  assert.equal(transferResponse.status, 201);

  const secondMiningResponse = await fetch(
    `${baseUrl}/api/mine`,
    {
      method: "POST",
    }
  );

  assert.equal(secondMiningResponse.status, 201);

  const finalVerificationResponse = await fetch(
    `${baseUrl}/api/verify/API-ROLEX-001`
  );

  assert.equal(finalVerificationResponse.status, 200);

  const finalVerification =
    await finalVerificationResponse.json();

  assert.equal(
    finalVerification.currentOwner,
    "0xAlice"
  );

  assert.equal(finalVerification.history.length, 2);
  assert.equal(finalVerification.verified, true);
  assert.deepEqual(
    finalVerification.pendingTransactions,
    []
  );
});

test("returns 404 when verifying an unknown product", async (t) => {
  const server = app.listen(0);

  t.after(() => {
    server.close();
  });

  await once(server, "listening");

  const { port } = server.address();

  const response = await fetch(
    `http://127.0.0.1:${port}/api/verify/UNKNOWN-PRODUCT`
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.status, "error");
  assert.equal(body.statusCode, 404);
  assert.match(body.message, /was not found/);
});