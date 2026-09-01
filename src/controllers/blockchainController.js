import { blockchain } from "../services/blockchainService.js";
import { AppError } from "../errors/AppError.js";

export function getChain(req, res) {
  res.status(200).json({
    difficulty: blockchain.difficulty,
    chainValid: blockchain.isChainValid(),
    length: blockchain.chain.length,
    chain: blockchain.chain,
    pendingTransactions:
      blockchain.pendingTransactions,
  });
}

export function createTransaction(req, res) {
  const transaction = blockchain.addTransaction(req.body);

  res.status(201).json({
    message:
      "Transaction accepted and added to pending pool",
    transaction,
  });
}

export function mineTransactions(req, res) {
  const block = blockchain.minePendingTransactions();

  res.status(201).json({
    message: "Block mined successfully",
    block,
  });
}

export function verifyProduct(req, res) {
  const { id } = req.params;

  const history = blockchain.getProductHistory(id);

  if (history.length === 0) {
    throw new AppError(
      `Product ${id} was not found`,
      404
    );
  }

  const state = blockchain.getProductState(id, false);

  const pendingTransactions =
    blockchain.pendingTransactions.filter(
      (transaction) =>
        transaction.serialNumber === id
    );

  res.status(200).json({
    serialNumber: id,
    verified: blockchain.isChainValid(),
    currentOwner: state.currentOwner,
    history,
    pendingTransactions,
  });
}