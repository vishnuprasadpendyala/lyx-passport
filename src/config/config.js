import "dotenv/config";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const powDifficulty = Number.parseInt(
  process.env.POW_DIFFICULTY ?? "1",
  10
);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

if (
  !Number.isInteger(powDifficulty) ||
  powDifficulty < 1 ||
  powDifficulty > 6
) {
  throw new Error(
    "POW_DIFFICULTY must be an integer between 1 and 6"
  );
}

export const config = Object.freeze({
  port,
  powDifficulty,
});