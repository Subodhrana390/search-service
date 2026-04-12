import { Request, Response } from "express";
import esClient from "../infra/elasticsearch.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";
import { GeoService } from "../services/geo.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { createInternalClient } from "../utils/http.js";
import { config } from "../config/index.js";

const inventoryClient = createInternalClient(
  config.services.inventory || "http://localhost:3008",
);
const shopClient = createInternalClient(
  config.services.shop || "http://localhost:3004",
);

/* ------------------ HELPERS ------------------ */

export const mapToProductDetails = (productData: any, shopData: any) => {
  if (!productData) {
    throw new ApiError(404, "Product not found");
  }

  const p = productData;
  const s = shopData;

  return {
    id: p?.id,
    name: p?.product?.name,
    description: p?.product?.description,
    brand: p?.product?.brand,

    images: p?.product?.images?.map((img: any) => img?.url) ?? [],
    primaryImage: p?.product?.primaryImage ?? null,
    productImage: p?.product?.primaryImage ?? null,

    price: {
      mrp: p?.pricing?.mrp ?? 0,
      sellingPrice: p?.pricing?.sellingPrice ?? 0,
      discount: p?.pricing?.discountPercentage ?? 0,
    },

    productCategory: p?.productCategory ?? null,

    availability: {
      inStock: (p?.availablePacks ?? 0) > 0,
      availablePacks: p?.availablePacks ?? 0,
    },

    attributes: p?.product?.attributes ?? [],

    packaging: {
      container: p?.packaging?.container ?? null,
      unitType: p?.packaging?.unitType ?? null,
    },

    expiryDate: p?.expiryDate ?? null,

    shop: s
      ? {
        id: s?.id,
        name: s?.name,
        rating: s?.ratings?.average ?? 0,
      }
      : null,
  };
};

export const search = asyncHandler(async (req: Request, res: Response) => {
  const {
    query,
    category,
    limit = "20",
    cursor,
    lat,
    lng,
    radius = "10",
  } = req.query as Record<string, string>;

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const radiusKm = parseFloat(radius);
  const pageSize = parseInt(limit);

  if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
    throw new ApiError(400, "Valid lat and lng are required");
  }

  const searchAfter = cursor
    ? JSON.parse(Buffer.from(cursor, "base64").toString())
    : undefined;

  const must: any[] = [];
  const filter: any[] = [];

  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["name^6", "brand^4", "description^2"],
        type: "bool_prefix",
      },
    });
  }

  if (category) {
    filter.push({
      term: {
        category: category.toUpperCase(),
      },
    });
  }

  filter.push({
    geo_distance: {
      distance: `${radiusKm}km`,
      location: {
        lat: userLat,
        lon: userLng,
      },
    },
  });

  const esResult = await esClient.search({
    index: "shop_products",
    body: {
      query: {
        bool: {
          must,
          filter,
        },
      },
      sort: [
        {
          _geo_distance: {
            location: { lat: userLat, lon: userLng },
            order: "asc",
            unit: "km",
            distance_type: "arc",
          },
        },
        { id: "asc" },
      ],
      search_after: searchAfter,
      size: pageSize,
    },
  });

  const hits = esResult.body.hits.hits;

  const response = hits.map((hit: any) => {
    const doc = hit._source;

    return {
      product: {
        id: doc.productId,
        name: doc.name,
        description: doc.description,
        image: doc.primaryImage,
        productImage: doc.productImage || doc.primaryImage,
        mrp: doc.pricing?.mrp,
        sellingPrice: doc.pricing?.sellingPrice,
        quantity: doc.stock,
        productCategory: doc.category,
      },
      shop: {
        id: doc.shopId,
        name: doc.shopName,
        distance: hit.sort?.[0] || 0,
        ratings: {
          average: doc.shopRating,
          count: 0,
        },
      },
    };
  });

  const nextCursor =
    hits.length === pageSize
      ? Buffer.from(JSON.stringify(hits[hits.length - 1].sort)).toString(
        "base64"
      )
      : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        results: response,
        pagination: {
          nextCursor,
          limit: pageSize,
          hasNextPage: hits.length === pageSize,
        },
      },
      "Success"
    )
  );
});

export const getNearbyShops = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      limit = "20",
      cursor,
      lat,
      lng,
      radius = "10",
    } = req.query as Record<string, string>;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
      throw new ApiError(400, "Valid lat and lng are required");
    }

    const shopIds = await GeoService.findNearbyShopIds(
      userLat,
      userLng,
      radiusKm
    );

    const pageSize = parseInt(limit);

    const searchAfter = cursor
      ? JSON.parse(Buffer.from(cursor, "base64").toString())
      : undefined;

    const esResult = await esClient.search({
      index: "shops",
      body: {
        query: {
          bool: {
            must: [
              { term: { status: "active" } },
              ...(shopIds.length > 0
                ? [{ terms: { id: shopIds } }]
                : [
                  {
                    geo_distance: {
                      distance: `${radiusKm}km`,
                      location: {
                        lat: userLat,
                        lon: userLng,
                      },
                    },
                  },
                ]),
            ],
          },
        },
        sort: [
          {
            _geo_distance: {
              location: { lat: userLat, lon: userLng },
              order: "asc",
              unit: "km",
              distance_type: "arc",
            },
          },
          { id: "asc" },
        ],
        search_after: searchAfter,
        size: pageSize,
      },
    });

    const hits = esResult.body.hits.hits;

    const shops = hits.map((hit: any) => {
      const doc = hit._source;

      return {
        ...doc,
        distance: hit.sort?.[0] || 0,
        source: "opensearch",
      };
    });

    const nextCursor =
      hits.length === pageSize
        ? Buffer.from(JSON.stringify(hits[hits.length - 1].sort)).toString(
          "base64"
        )
        : null;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          shops,
          pagination: {
            nextCursor,
            limit: pageSize,
            hasNextPage: hits.length === pageSize,
          },
        },
        "Success"
      )
    );
  }
);

export const getSingleProductDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, shopId } = req.query as Record<string, string>;

    const [productResult, shopResult] = await Promise.allSettled([
      inventoryClient.post("/api/v1/internal/inventory/items/single", {
        productId,
        shopId,
      }),
      shopClient.get(`/api/v1/internal/shops/details/${shopId}`),
    ]);

    console.log(productResult, shopResult)

    const productData =
      productResult.status === "fulfilled" ? productResult.value.data : null;
    const shopData =
      shopResult.status === "fulfilled" ? shopResult.value.data.data : null;

    const message =
      shopResult.status === "rejected"
        ? "Product data retrieved successfully. Shop info unavailable."
        : "Product data retrieved successfully.";

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          mapToProductDetails(productData.data, shopData),
          message,
        ),
      );
  },
);
