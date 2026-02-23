/**
 * Tiendanube API integration
 * Docs: https://tiendanube.github.io/api-documentation/
 */

const TIENDANUBE_API = "https://api.tiendanube.com/v1";

interface TiendanubeProduct {
  id: number;
  name: { es: string };
  description: { es: string };
  variants: Array<{
    id: number;
    price: string;
    stock: number | null;
    sku: string;
  }>;
  images: Array<{ src: string }>;
  categories: Array<{ id: number; name: { es: string } }>;
}

interface TiendanubeOrder {
  id: number;
  number: string;
  status: string;
  payment_status: string;
  total: string;
  currency: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  products: Array<{
    product_id: number;
    name: string;
    quantity: string;
    price: string;
  }>;
  created_at: string;
}

export class TiendanubeClient {
  constructor(
    private storeId: string,
    private accessToken: string
  ) {}

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${TIENDANUBE_API}/${this.storeId}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": "VendéBot/1.0",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tiendanube API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  /** Fetch all products (paginated) */
  async getProducts(page = 1, perPage = 50): Promise<TiendanubeProduct[]> {
    return this.request<TiendanubeProduct[]>(
      `/products?page=${page}&per_page=${perPage}`
    );
  }

  /** Fetch all products across all pages */
  async getAllProducts(): Promise<TiendanubeProduct[]> {
    const all: TiendanubeProduct[] = [];
    let page = 1;
    while (true) {
      const batch = await this.getProducts(page, 200);
      all.push(...batch);
      if (batch.length < 200) break;
      page++;
    }
    return all;
  }

  /** Update stock for a variant */
  async updateStock(
    productId: number,
    variantId: number,
    stock: number
  ): Promise<void> {
    await this.request(`/products/${productId}/variants/${variantId}`, {
      method: "PUT",
      body: JSON.stringify({ stock }),
    });
  }

  /** Fetch orders (paginated) */
  async getOrders(
    page = 1,
    perPage = 50,
    status?: string
  ): Promise<TiendanubeOrder[]> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (status) params.set("status", status);
    return this.request<TiendanubeOrder[]>(`/orders?${params}`);
  }

  /** Get single order */
  async getOrder(orderId: number): Promise<TiendanubeOrder> {
    return this.request<TiendanubeOrder>(`/orders/${orderId}`);
  }

  /** Update order status */
  async updateOrderStatus(
    orderId: number,
    status: "open" | "closed" | "cancelled"
  ): Promise<void> {
    if (status === "closed") {
      await this.request(`/orders/${orderId}/close`, { method: "POST" });
    } else if (status === "open") {
      await this.request(`/orders/${orderId}/open`, { method: "POST" });
    } else if (status === "cancelled") {
      await this.request(`/orders/${orderId}/cancel`, { method: "POST" });
    }
  }
}

/** Convert a Tiendanube product to our internal format */
export function mapTiendanubeProduct(tnProduct: TiendanubeProduct) {
  const variant = tnProduct.variants[0];
  return {
    name: tnProduct.name.es || Object.values(tnProduct.name)[0] || "Sin nombre",
    description:
      tnProduct.description?.es ||
      Object.values(tnProduct.description || {})[0] ||
      "",
    price: variant?.price || "0",
    inStock: variant?.stock === null || (variant?.stock ?? 0) > 0,
    imageUrl: tnProduct.images?.[0]?.src || null,
    category:
      tnProduct.categories?.[0]?.name?.es || null,
    metadata: {
      tiendanubeProductId: tnProduct.id,
      tiendanubeVariantId: variant?.id,
      sku: variant?.sku,
    },
  };
}
