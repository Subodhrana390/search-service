import axios, { AxiosInstance } from "axios";

/* ------------------ TYPES ------------------ */

export interface InventorySearchOptions {
  productName?: string;
  productCategory?: string;
  limit?: number;
  offset?: number;
}

export interface SingleInventoryParams {
  shopId: string;
  productId: string;
}

/* ------------------ SERVICE ------------------ */

class InventoryService {
  private static instance: InventoryService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL:
        process.env.APP_INVENTORY_SERVICE_URL ??
        "http://localhost:3008",
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": "discovery-service",
      },
    });
  }

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  /* ------------------ API METHODS ------------------ */

  async searchShopInventories(
    shopIds: string[],
    options: InventorySearchOptions = {}
  ): Promise<any> {
    const { data } = await this.client.post(
      "/internal/inventory/search",
      {
        shopIds,
        ...options,
      }
    );
    return data;
  }

  async getSingleShopIventory(
    params: SingleInventoryParams
  ): Promise<any> {
    const { data } = await this.client.post(
      "/internal/inventory/items/single",
      params
    );
    return data.data;
  }
}

export default InventoryService.getInstance();