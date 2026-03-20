import express from "express";
import {
  getNearbyShops,
  getSingleProductDetails,
  search,
} from "../controllers/discovery.controller.js";

const router = express.Router();

router.get("/search", search);
router.get("/shops", getNearbyShops);
router.get("/product", getSingleProductDetails);

export default router;
