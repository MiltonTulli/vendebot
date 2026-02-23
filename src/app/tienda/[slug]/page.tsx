import { db } from "@/lib/db";
import { seoPages, tenants, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPageData(slug: string) {
  const [page] = await db
    .select()
    .from(seoPages)
    .where(and(eq(seoPages.slug, slug), eq(seoPages.published, true)));

  if (!page) return null;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, page.tenantId));

  const catalog = page.showCatalog
    ? await db
        .select()
        .from(products)
        .where(and(eq(products.tenantId, page.tenantId), eq(products.inStock, true)))
    : [];

  return { page, tenant, catalog };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) return { title: "No encontrada" };

  return {
    title: `${data.page.title} | ${data.tenant?.businessName ?? "VendéBot"}`,
    description: data.page.description || `Comprá en ${data.tenant?.businessName}`,
    openGraph: {
      title: data.page.title,
      description: data.page.description || undefined,
      images: data.page.heroImage ? [data.page.heroImage] : undefined,
      type: "website",
    },
  };
}

export default async function TiendaPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) notFound();

  const { page, tenant, catalog } = data;
  const whatsappLink = tenant?.whatsappNumber
    ? `https://wa.me/${tenant.whatsappNumber.replace(/\D/g, "")}`
    : null;

  const formatPrice = (price: string) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
      parseFloat(price)
    );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header
        className="relative bg-gradient-to-br from-green-600 to-green-800 text-white"
        style={
          page.heroImage
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${page.heroImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
          {page.description && (
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-8">
              {page.description}
            </p>
          )}
          {page.showWhatsappButton && whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-8 py-4 rounded-full text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.685-1.228A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.332-.726-6.033-1.96l-.424-.316-2.787.731.746-2.72-.346-.55A9.954 9.954 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Hacé tu pedido por WhatsApp
            </a>
          )}
        </div>
      </header>

      {/* Catalog */}
      {page.showCatalog && catalog.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros productos</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {product.imageUrl && (
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  {product.category && (
                    <span className="text-xs font-medium text-green-600 uppercase">
                      {product.category}
                    </span>
                  )}
                  <h3 className="font-semibold text-lg mt-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-bold text-green-700">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-xs text-gray-400">/{product.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {page.showWhatsappButton && whatsappLink && (
        <section className="bg-green-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">¿Listo para comprar?</h2>
            <p className="text-gray-600 mb-8">
              Escribinos por WhatsApp y nuestro bot te atiende al instante 🤖
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-8 py-4 rounded-full text-lg hover:bg-green-700 transition-colors"
            >
              Iniciar chat
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            {tenant?.businessName} · Powered by{" "}
            <Link href="/" className="text-green-400 hover:underline">
              VendéBot
            </Link>
          </p>
        </div>
      </footer>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: tenant?.businessName,
            description: page.description,
            url: `https://vendebot.vercel.app/tienda/${slug}`,
            ...(tenant?.businessInfo &&
            typeof tenant.businessInfo === "object" &&
            "address" in tenant.businessInfo
              ? {
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: (tenant.businessInfo as Record<string, unknown>).address,
                  },
                }
              : {}),
          }),
        }}
      />
    </div>
  );
}
