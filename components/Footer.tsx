import type { Tenant } from "@/lib/tenants";

export function Footer({ tenant }: { tenant: Tenant }) {
  return (
    <footer className="border-t border-black/10 mt-12">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-foreground/60 flex flex-col sm:flex-row gap-2 justify-between">
        <span>
          © {tenant.name} — Catálogo de produtos
        </span>
        <span className="text-foreground/40">
          Vitrine para consulta. Para comprar, fale no WhatsApp.
        </span>
      </div>
    </footer>
  );
}
