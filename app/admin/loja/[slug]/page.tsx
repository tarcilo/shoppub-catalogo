import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { getTenantStore } from "@/lib/stores";
import { parseLojaForm } from "@/lib/loja-form";
import { LojaForm } from "@/components/LojaForm";

export default async function EditarLoja({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const email = await requireAdmin();
  const { slug } = await params;
  const { erro } = await searchParams;

  const tenant = await getTenantStore().getBySlug(slug);
  // só o dono edita
  if (!tenant || tenant.ownerEmail?.toLowerCase() !== email.toLowerCase()) {
    notFound();
  }

  async function updateLoja(formData: FormData) {
    "use server";
    const me = await requireAdmin();
    const t = await getTenantStore().getBySlug(slug);
    if (!t || t.ownerEmail?.toLowerCase() !== me.toLowerCase()) {
      redirect("/admin/dashboard");
    }
    await getTenantStore().update(slug, parseLojaForm(formData));
    redirect("/admin/dashboard");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/admin/dashboard" className="text-sm text-black/50 hover:text-black">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-2xl font-bold mb-6">Editar {tenant.name}</h1>
      <LojaForm action={updateLoja} tenant={tenant} erro={erro} />
    </div>
  );
}
