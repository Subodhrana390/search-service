import dotenv from "dotenv";
import app from "./app.js";
import { config } from "./config/index.js";
import { checkConnection } from "./infra/elasticsearch.js";

dotenv.config();

const PORT = config.port;

app.listen(PORT, async () => {
  await checkConnection();
  console.log(`Discovery Service running on port ${PORT}`);
});
