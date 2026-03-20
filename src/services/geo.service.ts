import redis from "../infra/redis/redis.js";

export interface GeoPoint {
  lat: number;
  lng: number;
}
export class GeoService {
  private static GEO_KEY = "shops:geo";

  static async findNearbyShopIds(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<string[]> {
    try {
      const shopIds = await redis.georadius(
        this.GEO_KEY,
        lng,
        lat,
        radiusKm,
        "km",
      );

      return shopIds as string[];
    } catch (error) {
      console.error("❌ Redis geo-radius query failed:", error);
      return [];
    }
  }
}
