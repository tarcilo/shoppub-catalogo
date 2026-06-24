import Link from "next/link";
import type { Tenant } from "@/lib/tenants";

export function Header({ tenant }: { tenant: Tenant }) {
  return (
    <header className="border-b border-black/10 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-primary shrink-0"
        >
          {tenant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo} alt={tenant.name} className="h-8" />
          ) : (
            tenant.name
          )}
        </Link>

        <form action="/produtos" className="flex-1 max-w-md ml-auto">
          <input
            type="search"
            name="busca"
            placeholder="Buscar produtos..."
            className="w-full rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-primary"
            aria-label="Buscar produtos"
          />
        </form>

        <Link
          href="/produtos"
          className="text-sm font-medium text-foreground/70 hover:text-primary hidden sm:block"
        >
          Ver tudo
        </Link>
      </div>
    </header>
  );
}
