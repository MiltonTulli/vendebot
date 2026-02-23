/**
 * MercadoLibre API integration
 * OAuth + REST endpoints for listing sync & stock management
 */

const MELI_API = "https://api.mercadolibre.com";
const MELI_AUTH_URL = "https://auth.mercadolibre.com.ar/authorization";

interface MeliItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  status: string;
  permalink: string;
  thumbnail: string;
  category_id: string;
  descriptions?: Array<{ plain_text: string }>;
}

interface MeliTokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
  expires_in: number;
}

export class MercadoLibreClient {
  constructor(
    private accessToken: string,
    private refreshToken?: string
  ) {}

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const res = await fetch(`${MELI_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MercadoLibre API error ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  /** Get the OAuth authorization URL */
  static getAuthUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
    });
    return `${MELI_AUTH_URL}?${params}`;
  }

  /** Exchange authorization code for tokens */
  static async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<MeliTokenResponse> {
    const res = await fetch(`${MELI_API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) throw new Error(`MeLi token exchange failed: ${await res.text()}`);
    return res.json() as Promise<MeliTokenResponse>;
  }

  /** Refresh access token */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<MeliTokenResponse> {
    const res = await fetch(`${MELI_API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) throw new Error(`MeLi token refresh failed: ${await res.text()}`);
    return res.json() as Promise<MeliTokenResponse>;
  }

  /** List user's items */
  async getMyItems(
    userId: string,
    offset = 0,
    limit = 50
  ): Promise<{ results: string[]; total: number }> {
    return this.request<{ results: string[]; total: number }>(
      `/users/${userId}/items/search?offset=${offset}&limit=${limit}`
    );
  }

  /** Get item details (supports multi-get) */
  async getItems(ids: string[]): Promise<MeliItem[]> {
    if (ids.length === 0) return [];
    // Multi-get endpoint
    const res = await this.request<Array<{ body: MeliItem }>>(
      `/items?ids=${ids.slice(0, 20).join(",")}`
    );
    return res.map((r) => r.body);
  }

  /** Get single item */
  async getItem(itemId: string): Promise<MeliItem> {
    return this.request<MeliItem>(`/items/${itemId}`);
  }

  /** Update item stock */
  async updateStock(itemId: string, quantity: number): Promise<void> {
    await this.request(`/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ available_quantity: quantity }),
    });
  }

  /** Update item price */
  async updatePrice(itemId: string, price: number): Promise<void> {
    await this.request(`/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ price }),
    });
  }

  /** Get all user items with details */
  async getAllItems(userId: string): Promise<MeliItem[]> {
    const all: MeliItem[] = [];
    let offset = 0;
    while (true) {
      const { results, total } = await this.getMyItems(userId, offset, 50);
      if (results.length === 0) break;
      const items = await this.getItems(results);
      all.push(...items);
      offset += results.length;
      if (offset >= total) break;
    }
    return all;
  }
}

/** Convert a MercadoLibre item to our internal format */
export function mapMeliItem(item: MeliItem) {
  return {
    name: item.title,
    description: "",
    price: String(item.price),
    inStock: item.available_quantity > 0,
    imageUrl: item.thumbnail,
    category: item.category_id,
    metadata: {
      mercadolibreItemId: item.id,
      permalink: item.permalink,
      currency: item.currency_id,
    },
  };
}
