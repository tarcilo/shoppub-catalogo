import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { getTenantStore } from "@/lib/stores";
import { validateSlug } from "@/lib/tenants";
import { parseLojaForm } from "@/lib/loja-form";
import { saveLogo, LogoError } from "@/lib/logo";
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

  let logo: string | undefined;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    try {
      logo = await saveLogo(file, slug);
    } catch (e) {
      if (e instanceof LogoError) {
        redirect(`/admin/loja/new?erro=${encodeURIComponent(e.message)}`);
      }
      throw e;
    }
  }

  await getTenantStore().create({
    ...parseLojaForm(formData),
    slug,
    logo,
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
