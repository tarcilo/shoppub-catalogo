import type { Tenant } from "./tenants";

// Lê os campos de texto do formulário de loja (o logo é tratado à parte, upload).
export function parseLojaForm(
  form: FormData
): Omit<Tenant, "slug" | "ownerEmail" | "logo"> {
  return {
    name: String(form.get("name") ?? "").trim(),
    feedUrl: String(form.get("feedUrl") ?? "").trim(),
    whatsapp: String(form.get("whatsapp") ?? "").replace(/\D/g, ""),
    primaryColor: String(form.get("primaryColor") ?? "#4a3b2a"),
    showPrice: form.get("showPrice") === "on",
  };
}
