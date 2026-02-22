/**
 * AI Tool definitions for OpenAI function calling.
 *
 * These tools allow the AI to interact with the catalog, orders, and business info.
 * Prices are ALWAYS read from the database — the AI never invents prices.
 */

import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const aiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the product catalog by name, category, or description. Returns matching products with prices and availability.",
      parameters: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query (product name, category, or keyword)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description:
        "Get full details of a specific product including price, unit, description, and availability.",
      parameters: {
        type: "object" as const,
        properties: {
          id: {
            type: "string",
            description: "Product UUID",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_price",
      description:
        "Calculate the total price for a product given quantity and optional dimensions. Handles unit conversion, waste percentage, and returns the exact total. ALWAYS use this instead of calculating prices yourself.",
      parameters: {
        type: "object" as const,
        properties: {
          product_id: {
            type: "string",
            description: "Product UUID",
          },
          quantity: {
            type: "number",
            description:
              "Quantity in the product's unit (e.g., 2 for 2 units, 1.5 for 1.5 kg)",
          },
          width_m: {
            type: "number",
            description: "Width in meters (for m² products)",
          },
          height_m: {
            type: "number",
            description: "Height in meters (for m² products)",
          },
        },
        required: ["product_id", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check if a specific product is currently in stock.",
      parameters: {
        type: "object" as const,
        properties: {
          product_id: {
            type: "string",
            description: "Product UUID",
          },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description:
        "Create a new order for the customer. Only call this after confirming items and prices with the customer.",
      parameters: {
        type: "object" as const,
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                product_name: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
                total: { type: "number" },
              },
              required: [
                "product_id",
                "product_name",
                "quantity",
                "unit_price",
                "total",
              ],
            },
            description: "List of items to order",
          },
          notes: {
            type: "string",
            description: "Optional notes for the order",
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_business_info",
      description:
        "Get business information: name, address, hours, delivery zones, description.",
      parameters: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description:
        "Hand off the conversation to the business owner. Use when: the customer explicitly asks to speak to a person, the query is too complex, or involves complaints/issues.",
      parameters: {
        type: "object" as const,
        properties: {
          reason: {
            type: "string",
            description: "Why the conversation is being escalated",
          },
        },
        required: ["reason"],
      },
    },
  },
];
