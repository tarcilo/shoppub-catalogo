import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { getTenantStore } from "@/lib/stores";
import { parseLojaForm } from "@/lib/loja-form";
import { saveLogo, LogoError } from "@/lib/logo";
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

    // mantém a logo atual se nenhum arquivo novo for enviado
    let logo = t.logo;
    const file = formData.get("logo");
    if (file instanceof File && file.size > 0) {
      try {
        logo = await saveLogo(file, slug);
      } catch (e) {
        if (e instanceof LogoError) {
          redirect(`/admin/loja/${slug}?erro=${encodeURIComponent(e.message)}`);
        }
        throw e;
      }
    }

    await getTenantStore().update(slug, { ...parseLojaForm(formData), logo });
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
