import { config } from "../config/index.js";
import { Client } from "@opensearch-project/opensearch";

const esClient = new Client({
  node: config.elasticsearch.node || "http://172.20.32.1:9200",
});

export const checkConnection = async () => {
  try {
    const health = await esClient.cluster.health({});
    console.log(
      "✅ Elasticsearch connected (discovery-service):",
      health.body.status,
    );
    return true;
  } catch (error) {
    console.error(
      "❌ Elasticsearch connection failed (discovery-service):",
      error,
    );
    return false;
  }
};

export default esClient;
