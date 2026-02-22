# VendéBot — Implementation Roadmap

## Phase 0 — Project Setup
- [x] Init Next.js 16 + TypeScript + Tailwind (2026-02-22)
- [x] GitHub repo: MiltonTulli/vendebot (2026-02-22)
- [x] Vercel deploy: vendebot.vercel.app (2026-02-22)
- [ ] Install core dependencies: shadcn/ui, drizzle-orm, @neondatabase/serverless, clerk, twilio
- [ ] Setup Drizzle ORM + Neon PostgreSQL connection
- [ ] Setup Clerk auth
- [ ] Setup shadcn/ui components
- [ ] Create DB schema (tenants, products, customers, orders, conversations, invoices)
- [ ] Run initial migration
- [ ] Basic layout: sidebar + header + main content area

## Phase 1 — WhatsApp Integration (Twilio abstracted)
- [ ] Create WhatsApp provider abstraction layer (`src/lib/whatsapp/provider.ts`)
  - Interface: `sendMessage()`, `sendTemplate()`, `sendInteractiveButtons()`, `sendList()`
  - Twilio implementation (`src/lib/whatsapp/twilio.ts`)
  - Meta Cloud API implementation stub (`src/lib/whatsapp/meta.ts`) — for future migration
- [ ] Twilio WhatsApp Sandbox setup (for development)
- [ ] Webhook endpoint: `POST /api/webhook/whatsapp` — receive incoming messages
- [ ] Message queue: process incoming messages async
- [ ] Parse message types: text, image, audio, location, interactive reply
- [ ] Store conversations in DB
- [ ] Basic echo bot (responds with "Recibido: [message]") for testing

## Phase 2 — AI Engine
- [ ] OpenAI integration with function calling (`src/lib/ai/engine.ts`)
- [ ] System prompt builder per tenant (`src/lib/ai/prompts.ts`)
- [ ] Tool definitions:
  - `search_products(query: string)` — semantic search in catalog
  - `get_product(id: string)` — full product details + price
  - `calculate_price(product_id, quantity, dimensions?)` — smart pricing with units + waste
  - `check_availability(product_id)` — stock check
  - `create_order(items[], customer)` — build order
  - `get_business_info()` — hours, location, delivery zones
  - `escalate_to_human(reason)` — hand off to owner
- [ ] Conversation context management (sliding window + summary)
- [ ] Price hallucination prevention: AI NEVER generates prices, only reads from DB
- [ ] Fallback responses for unknown queries

## Phase 3 — Catalog Management
- [ ] Product CRUD API (`/api/products`)
- [ ] CSV/Excel upload + AI parsing (`/api/catalog/import`)
- [ ] Google Sheets OAuth + sync (`/api/catalog/sheets`)
- [ ] Support units: unidad, kg, m², m lineal, litro, docena, combo
- [ ] Configurable waste percentage per product
- [ ] Smart price calculator:
  - "Necesito para 3x2.5m" → 7.5m² + 5% waste = 7.88m² × price
  - "2 docenas de empanadas de carne" → 2 × dozen_price
  - "500g de tomate" → 0.5 × kg_price

## Phase 4 — Dashboard
- [ ] Landing page (public)
- [ ] Auth pages (Clerk)
- [ ] Onboarding wizard (business info → connect WhatsApp → upload catalog → customize bot → test → go live)
- [ ] Dashboard home: today's orders, messages, revenue
- [ ] Orders page: list, filter, detail, status management
- [ ] Catalog page: product grid/table, CRUD, import/export
- [ ] Conversations page: chat history, real-time view, manual intervention
- [ ] Customers page: list, detail, order history
- [ ] Settings: business info, bot personality, hours, notifications

## Phase 5 — Owner Management Channel
- [ ] Dedicated WhatsApp channel for owner ↔ bot communication
- [ ] Natural language commands:
  - Update prices: "El tomate ahora sale $2500/kg"
  - Change hours: "Hoy cerramos a las 15"
  - Add product: "Agregá empanadas de humita a $800"
  - Remove product: "Sacá el sushi especial del menú"
  - Check sales: "¿Cuánto vendí hoy?"
  - Broadcast: "Avisale a los que preguntaron por X que ya llegó"
- [ ] Confirmation for each action: "✅ Actualizado: tomate → $2.500/kg"
- [ ] Change log in dashboard

## Phase 6 — Payments (MercadoPago)
- [ ] MercadoPago OAuth integration
- [ ] Generate checkout links on order confirmation
- [ ] Send payment link via WhatsApp
- [ ] Webhook: payment confirmed → update order status → notify owner
- [ ] Dashboard: payment status per order

## Phase 7 — Invoicing (ARCA/AFIP)
- [ ] Integrate @afipsdk/afip.js
- [ ] Testing environment (homologación) setup
- [ ] Onboarding: guide for certificate generation + upload
- [ ] Invoice generation on payment confirmation
- [ ] Auto-determine invoice type (A/B/C) based on buyer fiscal data
- [ ] Request fiscal data from buyer via WhatsApp if needed
- [ ] PDF generation + send via WhatsApp
- [ ] Dashboard: invoice list, download, CAE status

## Phase 8 — Integrations
- [ ] Tiendanube API (product sync, stock sync, order sync)
- [ ] MercadoLibre API (listing sync, stock)
- [ ] External database connector (PostgreSQL/MySQL read)
- [ ] Order tracking page (public link per order)
- [ ] WhatsApp status updates on order state changes

## Phase 9 — Growth
- [ ] WhatsApp broadcast campaigns (with Meta template approval)
- [ ] SEO landing pages
- [ ] Analytics dashboard (conversion, revenue, popular products)
- [ ] Multi-tenant billing (Stripe or MercadoPago subscriptions)
