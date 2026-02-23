import { db } from "@/lib/db";
import { orders, orderTrackingTokens, customers, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

const statusSteps = [
  { key: "pending", label: "Pendiente", emoji: "🕐" },
  { key: "confirmed", label: "Confirmado", emoji: "✅" },
  { key: "preparing", label: "Preparando", emoji: "👨‍🍳" },
  { key: "ready", label: "Listo", emoji: "🎉" },
  { key: "delivered", label: "Entregado", emoji: "📬" },
];

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const trackingRow = await db
    .select()
    .from(orderTrackingTokens)
    .where(eq(orderTrackingTokens.token, token))
    .then((r) => r[0]);

  if (!trackingRow) notFound();

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, trackingRow.orderId))
    .then((r) => r[0]);

  if (!order) notFound();

  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId))
    .then((r) => r[0]);

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, order.tenantId))
    .then((r) => r[0]);

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const items = order.items as Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">{tenant?.businessName || "VendéBot"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Status tracker */}
        {isCancelled ? (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <span className="text-3xl">❌</span>
            <p className="mt-2 text-lg font-semibold text-red-700">
              Pedido cancelado
            </p>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-gray-500 uppercase">
              Estado del pedido
            </h2>
            <div className="space-y-4">
              {statusSteps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                        isCurrent
                          ? "bg-blue-500 text-white ring-4 ring-blue-100"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? step.emoji : i + 1}
                    </div>
                    <span
                      className={`text-sm ${
                        isCurrent
                          ? "font-semibold text-blue-600"
                          : isCompleted
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-500 uppercase">
            Detalle del pedido
          </h2>
          {customer?.name && (
            <p className="mb-3 text-sm text-gray-600">
              Cliente: <strong>{customer.name}</strong>
            </p>
          )}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.productName}
                </span>
                <span className="font-medium">
                  ${item.total.toLocaleString("es-AR")}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span>${Number(order.totalAmount).toLocaleString("es-AR")}</span>
            </div>
          </div>
          {order.notes && (
            <p className="mt-3 text-xs text-gray-500">📝 {order.notes}</p>
          )}
          <p className="mt-4 text-xs text-gray-400">
            Creado: {new Date(order.createdAt).toLocaleString("es-AR")}
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Powered by VendéBot 🤖
        </p>
      </div>
    </div>
  );
}
