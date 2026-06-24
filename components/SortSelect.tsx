"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "nome", label: "Nome (A-Z)" },
];

export function SortSelect({ loja }: { loja: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("ordenar") ?? "relevancia";

  function onChange(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "relevancia") next.delete("ordenar");
    else next.set("ordenar", value);
    next.delete("page");
    router.push(`/${loja}/produtos?${next.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-primary bg-white"
      aria-label="Ordenar produtos"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
