import dotenv from "dotenv";
import fs from 'fs';

dotenv.config({});

export const config = {
  port: Number(process.env.APP_DISCOVERY_SERVICE_PORT),
  redis: {
    uri: process.env.APP_REDIS_URL!,
  },
  elasticsearch: {
    node: process.env.APP_ELASTICSEARCH_NODE!
  },
  services: {
    inventory: process.env.APP_INVENTORY_SERVICE_URL,
    shop: process.env.APP_SHOP_SERVICE_URL
  }
};
