const KOMERZA_API_BASE = "https://api.komerza.com";

export class KomerzaConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KomerzaConfigurationError";
  }
}

export interface KomerzaVariant {
  id?: string;
  name?: string;
  cost?: number;
  stock?: number;
  imageNames?: string[];
}

export interface KomerzaProduct {
  id: string;
  name: string;
  isBestSeller?: boolean;
  order?: number;
  stock?: number;
  imageNames?: string[];
  variants?: KomerzaVariant[];
}

function getConfig() {
  const token = process.env.KOMERZA_API_TOKEN;
  const storeId = process.env.KOMERZA_STORE_ID;
  if (!token || !storeId) {
    throw new KomerzaConfigurationError(
      "KOMERZA_API_TOKEN and KOMERZA_STORE_ID are required",
    );
  }
  return {
    token,
    storeId,
    baseUrl: process.env.KOMERZA_API_BASE_URL ?? KOMERZA_API_BASE,
  };
}

export function isKomerzaConfigured(): boolean {
  return Boolean(process.env.KOMERZA_API_TOKEN && process.env.KOMERZA_STORE_ID);
}

export async function fetchKomerzaProducts(): Promise<KomerzaProduct[]> {
  const config = getConfig();
  const products: KomerzaProduct[] = [];

  for (let page = 1; page <= 50; page += 1) {
    const url = new URL(
      `/stores/${config.storeId}/products`,
      config.baseUrl,
    );
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", "100");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "User-Agent": "SicarioShopBot/1.0",
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Komerza responded with HTTP ${response.status}`);
    }

    const body = (await response.json()) as {
      success?: boolean;
      message?: string | null;
      data?: KomerzaProduct[];
      pages?: number;
    };

    if (body.success === false) {
      throw new Error(body.message ?? "Komerza request failed");
    }

    const pageProducts = Array.isArray(body.data) ? body.data : [];
    products.push(...pageProducts);

    if (pageProducts.length === 0 || !body.pages || page >= body.pages) {
      break;
    }
  }

  return products;
}

export function productImageUrls(
  product: KomerzaProduct,
  storeId = process.env.KOMERZA_STORE_ID ?? "",
): string[] {
  const names =
    product.variants?.find((variant) => (variant.imageNames?.length ?? 0) > 0)
      ?.imageNames ??
    product.imageNames ??
    [];

  return names.map((name) =>
    name.startsWith("http")
      ? name
      : `https://cdn.komerza.com/stores/${storeId}/products/${product.id}/${encodeURIComponent(name)}`,
  );
}