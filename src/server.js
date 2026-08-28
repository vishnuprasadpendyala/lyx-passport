import { app } from "./app.js";
import { config } from "./config/config.js";

app.listen(config.port, () => {
  console.log(`lyx-passport listening on port ${config.port}`);
});