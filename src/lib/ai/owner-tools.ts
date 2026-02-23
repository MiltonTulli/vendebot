/**
 * AI Tool definitions for owner management channel.
 */

import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const ownerAiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "owner_search_products",
      description:
        "Search products in the catalog. Use this to find a product before updating/removing it.",
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
      name: "owner_update_price",
      description:
        "Update the price of a product. Use after confirming with the owner which product to update.",
      parameters: {
        type: "object" as const,
        properties: {
          product_id: {
            type: "string",
            description: "Product UUID",
          },
          new_price: {
            type: "number",
            description: "New price in ARS",
          },
        },
        required: ["product_id", "new_price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owner_update_hours",
      description:
        "Update the business hours. Can be a permanent change or just for today.",
      parameters: {
        type: "object" as const,
        properties: {
          new_hours: {
            type: "string",
            description:
              "New hours description (e.g., 'Lunes a viernes 9-18, Sábados 9-13')",
          },
        },
        required: ["new_hours"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owner_add_product",
      description: "Add a new product to the catalog.",
      parameters: {
        type: "object" as const,
        properties: {
          name: {
            type: "string",
            description: "Product name",
          },
          price: {
            type: "number",
            description: "Price in ARS",
          },
          unit: {
            type: "string",
            enum: ["unidad", "kg", "m2", "m_lineal", "litro", "docena", "combo"],
            description: "Unit of measurement (default: unidad)",
          },
          category: {
            type: "string",
            description: "Product category (optional)",
          },
          description: {
            type: "string",
            description: "Product description (optional)",
          },
        },
        required: ["name", "price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owner_remove_product",
      description:
        "Remove a product from the catalog (marks it as out of stock).",
      parameters: {
        type: "object" as const,
        properties: {
          product_id: {
            type: "string",
            description: "Product UUID to remove",
          },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owner_check_sales",
      description:
        "Check sales summary: today's orders, revenue, pending orders, etc.",
      parameters: {
        type: "object" as const,
        properties: {
          period: {
            type: "string",
            enum: ["today", "week", "month"],
            description: "Period to check (default: today)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "owner_broadcast",
      description:
        "Send a broadcast message to customers. Can target all customers or those who asked about a specific product.",
      parameters: {
        type: "object" as const,
        properties: {
          message: {
            type: "string",
            description: "Message to broadcast",
          },
          product_query: {
            type: "string",
            description:
              "Optional: filter customers who asked about this product",
          },
        },
        required: ["message"],
      },
    },
  },
];
