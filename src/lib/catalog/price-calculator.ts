/**
 * Smart price calculator for VendéBot.
 * Handles area, weight, dozen, linear, and combo calculations
 * with configurable waste percentages.
 */

export type UnitType = "unidad" | "kg" | "m2" | "m_lineal" | "litro" | "docena" | "combo";

export interface PriceCalculationInput {
  unitPrice: number;
  unit: UnitType;
  quantity: number;
  wastePercentage?: number;
  /** For m² calculations */
  widthM?: number;
  heightM?: number;
  /** For kg — allow grams input */
  grams?: number;
}

export interface PriceCalculationResult {
  baseQuantity: number;
  quantityWithWaste: number;
  wastePercentage: number;
  unitPrice: number;
  unit: UnitType;
  subtotal: number;
  total: number;
  breakdown: string;
}

export function calculateSmartPrice(input: PriceCalculationInput): PriceCalculationResult {
  const { unitPrice, unit, wastePercentage = 0 } = input;
  let baseQuantity = input.quantity;

  let breakdown = "";

  switch (unit) {
    case "m2": {
      // If dimensions provided, calculate area
      if (input.widthM && input.heightM) {
        const area = input.widthM * input.heightM;
        baseQuantity = area * (input.quantity || 1);
        breakdown = `${input.widthM}m × ${input.heightM}m = ${area.toFixed(2)}m²`;
        if (input.quantity > 1) breakdown += ` × ${input.quantity} = ${baseQuantity.toFixed(2)}m²`;
      } else {
        breakdown = `${baseQuantity}m²`;
      }
      break;
    }
    case "kg": {
      // Support grams input
      if (input.grams) {
        baseQuantity = input.grams / 1000;
        breakdown = `${input.grams}g = ${baseQuantity}kg`;
      } else {
        breakdown = `${baseQuantity}kg`;
      }
      break;
    }
    case "docena": {
      breakdown = `${baseQuantity} docena(s) (${baseQuantity * 12} unidades)`;
      break;
    }
    case "m_lineal": {
      breakdown = `${baseQuantity}m lineal`;
      break;
    }
    case "litro": {
      breakdown = `${baseQuantity} litro(s)`;
      break;
    }
    case "combo": {
      breakdown = `${baseQuantity} combo(s)`;
      break;
    }
    case "unidad":
    default: {
      breakdown = `${baseQuantity} unidad(es)`;
      break;
    }
  }

  const quantityWithWaste = wastePercentage > 0
    ? baseQuantity * (1 + wastePercentage / 100)
    : baseQuantity;

  const subtotal = baseQuantity * unitPrice;
  const total = quantityWithWaste * unitPrice;

  if (wastePercentage > 0) {
    breakdown += ` + ${wastePercentage}% desperdicio = ${quantityWithWaste.toFixed(4)} ${unit}`;
  }

  breakdown += ` × $${unitPrice.toFixed(2)} = $${total.toFixed(2)}`;

  return {
    baseQuantity: round(baseQuantity),
    quantityWithWaste: round(quantityWithWaste),
    wastePercentage,
    unitPrice,
    unit,
    subtotal: round(subtotal),
    total: round(total),
    breakdown,
  };
}

function round(n: number, decimals = 2): number {
  return parseFloat(n.toFixed(decimals));
}
