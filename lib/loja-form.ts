import type { Tenant } from "./tenants";

// Lê os campos comuns do formulário de loja (sem o slug).
export function parseLojaForm(
  form: FormData
): Omit<Tenant, "slug" | "ownerEmail"> {
  return {
    name: String(form.get("name") ?? "").trim(),
    feedUrl: String(form.get("feedUrl") ?? "").trim(),
    whatsapp: String(form.get("whatsapp") ?? "").replace(/\D/g, ""),
    primaryColor: String(form.get("primaryColor") ?? "#4a3b2a"),
    logo: String(form.get("logo") ?? "").trim() || undefined,
    showPrice: form.get("showPrice") === "on",
  };
}
