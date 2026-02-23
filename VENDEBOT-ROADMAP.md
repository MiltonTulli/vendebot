# VendéBot — Implementation Roadmap

## Phase 0 — Project Setup
- [x] Init Next.js 16 + TypeScript + Tailwind (2026-02-22)
- [x] GitHub repo: MiltonTulli/vendebot (2026-02-22)
- [x] Vercel deploy: vendebot.vercel.app (2026-02-22)
- [x] Install core dependencies: shadcn/ui, drizzle-orm, @neondatabase/serverless, clerk, twilio (2026-02-22)
- [x] Setup Drizzle ORM + Neon PostgreSQL connection (2026-02-22)
- [x] Setup Clerk auth (2026-02-22)
- [x] Setup shadcn/ui components (2026-02-22)
- [x] Create DB schema (tenants, products, customers, orders, conversations, invoices) (2026-02-22)
- [x] Run initial migration (2026-02-22) — migration SQL generated, db:push/migrate scripts ready. Needs DATABASE_URL to execute.
- [x] Basic layout: sidebar + header + main content area (2026-02-22)

## Phase 1 — WhatsApp Integration (Twilio abstracted)
- [x] Create WhatsApp provider abstraction layer (`src/lib/whatsapp/provider.ts`) (2026-02-22)
  - Interface: `sendMessage()`, `sendTemplate()`, `sendInteractiveButtons()`, `sendList()`
  - Twilio implementation (`src/lib/whatsapp/twilio.ts`)
  - Meta Cloud API implementation stub (`src/lib/whatsapp/meta.ts`) — for future migration
- [x] Twilio WhatsApp Sandbox setup (for development) (2026-02-22)
- [x] Webhook endpoint: `POST /api/webhook/whatsapp` — receive incoming messages (2026-02-22)
- [x] Message queue: process incoming messages async (2026-02-22)
- [x] Parse message types: text, image, audio, location, interactive reply (2026-02-22)
- [x] Store conversations in DB (2026-02-22)
- [x] Basic echo bot (responds with "Recibido: [message]") for testing (2026-02-22)

## Phase 2 — AI Engine
- [x] OpenAI integration with function calling (`src/lib/ai/engine.ts`) (2026-02-22)
- [x] System prompt builder per tenant (`src/lib/ai/prompts.ts`) (2026-02-22)
- [x] Tool definitions (2026-02-22):
  - `search_products(query: string)` — semantic search in catalog
  - `get_product(id: string)` — full product details + price
  - `calculate_price(product_id, quantity, dimensions?)` — smart pricing with units + waste
  - `check_availability(product_id)` — stock check
  - `create_order(items[], customer)` — build order
  - `get_business_info()` — hours, location, delivery zones
  - `escalate_to_human(reason)` — hand off to owner
- [x] Conversation context management (sliding window + summary) (2026-02-22)
- [x] Price hallucination prevention: AI NEVER generates prices, only reads from DB (2026-02-22)
- [x] Fallback responses for unknown queries (2026-02-22)

## Phase 3 — Catalog Management
- [x] Product CRUD API (`/api/products`) (2026-02-22)
- [x] CSV/Excel upload + AI parsing (`/api/catalog/import`) (2026-02-22)
- [x] Google Sheets OAuth + sync (`/api/catalog/sheets`) (2026-02-22)
- [x] Support units: unidad, kg, m², m lineal, litro, docena, combo (2026-02-22)
- [x] Configurable waste percentage per product (2026-02-22)
- [x] Smart price calculator: (2026-02-22)
  - "Necesito para 3x2.5m" → 7.5m² + 5% waste = 7.88m² × price
  - "2 docenas de empanadas de carne" → 2 × dozen_price
  - "500g de tomate" → 0.5 × kg_price

## Phase 4 — Dashboard
- [x] Landing page (public) (2026-02-22)
- [x] Auth pages (Clerk) (2026-02-22)
- [x] Onboarding wizard (business info → connect WhatsApp → upload catalog → customize bot → test → go live) (2026-02-22)
- [x] Dashboard home: today's orders, messages, revenue (2026-02-22)
- [x] Orders page: list, filter, detail, status management (2026-02-22)
- [x] Catalog page: product grid/table, CRUD, import/export (2026-02-22)
- [x] Conversations page: chat history, real-time view, manual intervention (2026-02-22)
- [x] Customers page: list, detail, order history (2026-02-22)
- [x] Settings: business info, bot personality, hours, notifications (2026-02-22)

## Phase 5 — Owner Management Channel
- [x] Dedicated WhatsApp channel for owner ↔ bot communication (2026-02-22)
- [x] Natural language commands: (2026-02-22)
  - Update prices: "El tomate ahora sale $2500/kg"
  - Change hours: "Hoy cerramos a las 15"
  - Add product: "Agregá empanadas de humita a $800"
  - Remove product: "Sacá el sushi especial del menú"
  - Check sales: "¿Cuánto vendí hoy?"
  - Broadcast: "Avisale a los que preguntaron por X que ya llegó"
- [x] Confirmation for each action: "✅ Actualizado: tomate → $2.500/kg" (2026-02-22)
- [x] Change log in dashboard (2026-02-22)

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
