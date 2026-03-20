import axios, { AxiosInstance } from "axios";

/* ------------------ TYPES ------------------ */

export interface NearbyShopParams {
  lat: number;
  lng: number;
  radiusKm: number;
  limit?: number;
}

/* ------------------ SERVICE ------------------ */

class ShopService {
  private static instance: ShopService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL:
        process.env.MEDICAL_SHOP_SERVICE_URL ||
        "http://localhost:3004",
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": "discovery-service",
      },
    });
  }

  /* ------------------ SINGLETON ------------------ */

  static getInstance(): ShopService {
    if (!ShopService.instance) {
      ShopService.instance = new ShopService();
    }
    return ShopService.instance;
  }

  /* ------------------ API METHODS ------------------ */

  async getShopDetails(shopId: string): Promise<any> {
    const { data } = await this.client.get(
      `/api/v1/internal/shops/details/${shopId}`
    );
    return data.data;
  }
}

export default ShopService.getInstance();