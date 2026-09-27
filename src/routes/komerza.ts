import { Router, type IRouter } from "express";
import {
  fetchKomerzaProducts,
  isKomerzaConfigured,
  productImageUrls,
  type KomerzaProduct,
} from "../lib/komerza";

const router: IRouter = Router();

function publicProduct(product: KomerzaProduct) {
  const variant = product.variants?.find((item) => typeof item.cost === "number");
  return {
    id: product.id,
    name: product.name,
    price: variant?.cost ?? null,
    currency: "EUR",
    stock: product.stock ?? variant?.stock ?? null,
    imageUrls: productImageUrls(product),
    isBestSeller: product.isBestSeller ?? false,
    order: product.order ?? null,
  };
}

async function loadProducts() {
  const products = await fetchKomerzaProducts();
  return products.map(publicProduct);
}

router.get("/komerza/products", async (req, res) => {
  if (!isKomerzaConfigured()) {
    res.status(503).json({ error: "Komerza is not configured" });
    return;
  }

  try {
    const products = await loadProducts();
    const search = String(req.query.search ?? "").trim().toLocaleLowerCase();
    const availability = String(req.query.availability ?? "all");
    const result = products
      .filter((product) => !search || product.name.toLocaleLowerCase().includes(search))
      .filter((product) => {
        if (availability === "available") return product.stock !== null && product.stock > 0;
        if (availability === "unavailable") return product.stock !== null && product.stock <= 0;
        return true;
      });

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Unable to load Komerza products");
    res.status(502).json({ error: "Komerza catalogue is temporarily unavailable" });
  }
});

router.get("/komerza/products/:productId", async (req, res) => {
  if (!isKomerzaConfigured()) {
    res.status(503).json({ error: "Komerza is not configured" });
    return;
  }

  try {
    const product = (await loadProducts()).find((item) => item.id === req.params.productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(product);
  } catch (error) {
    req.log.error({ err: error }, "Unable to load Komerza product");
    res.status(502).json({ error: "Komerza catalogue is temporarily unavailable" });
  }
});

export default router;