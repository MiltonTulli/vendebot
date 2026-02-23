/**
 * VendéBot subscription plans — Argentine market, MercadoPago preapproval.
 */

export interface Plan {
  id: "starter" | "pro" | "business";
  name: string;
  priceArs: number;
  features: string[];
  limits: {
    monthlyMessages: number;
    products: number;
    campaigns: number;
  };
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceArs: 15000,
    features: [
      "Hasta 500 mensajes/mes",
      "50 productos",
      "1 campaña/mes",
      "Bot con IA",
      "Dashboard básico",
    ],
    limits: { monthlyMessages: 500, products: 50, campaigns: 1 },
  },
  {
    id: "pro",
    name: "Pro",
    priceArs: 35000,
    features: [
      "Hasta 3.000 mensajes/mes",
      "500 productos",
      "10 campañas/mes",
      "Bot con IA avanzado",
      "Analytics completo",
      "Integraciones (Tiendanube, ML)",
      "Facturación ARCA",
    ],
    limits: { monthlyMessages: 3000, products: 500, campaigns: 10 },
  },
  {
    id: "business",
    name: "Business",
    priceArs: 75000,
    features: [
      "Mensajes ilimitados",
      "Productos ilimitados",
      "Campañas ilimitadas",
      "Bot con IA premium",
      "Analytics avanzado",
      "Todas las integraciones",
      "Facturación ARCA",
      "Soporte prioritario",
      "API personalizada",
    ],
    limits: { monthlyMessages: Infinity, products: Infinity, campaigns: Infinity },
  },
];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
