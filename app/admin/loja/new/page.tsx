import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { getTenantStore } from "@/lib/stores";
import { validateSlug } from "@/lib/tenants";
import { parseLojaForm } from "@/lib/loja-form";
import { LojaForm } from "@/components/LojaForm";

async function createLoja(formData: FormData) {
  "use server";
  const email = await requireAdmin();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  const slugErr = validateSlug(slug);
  if (slugErr) {
    redirect(`/admin/loja/new?erro=${encodeURIComponent(slugErr)}`);
  }
  if (await getTenantStore().slugExists(slug)) {
    redirect(
      `/admin/loja/new?erro=${encodeURIComponent("Esse endereço já está em uso.")}`
    );
  }

  await getTenantStore().create({
    ...parseLojaForm(formData),
    slug,
    ownerEmail: email,
  });
  redirect("/admin/dashboard");
}

export default async function NovaLoja({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireAdmin();
  const { erro } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/admin/dashboard" className="text-sm text-black/50 hover:text-black">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-bold mb-6">Nova loja</h1>
      <LojaForm action={createLoja} erro={erro} />
    </div>
  );
}
