import Link from "next/link";
import type { Tenant } from "@/lib/tenants";

// Formulário de cadastro/edição de loja. `action` é uma server action.
export function LojaForm({
  action,
  tenant,
  erro,
}: {
  action: (formData: FormData) => void | Promise<void>;
  tenant?: Tenant;
  erro?: string;
}) {
  const isNew = !tenant;

  return (
    <form action={action} className="space-y-4">
      {erro && (
        <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-200">
          {erro}
        </div>
      )}

      <Field label="Nome da loja">
        <input
          name="name"
          required
          defaultValue={tenant?.name}
          className={inputCls}
          placeholder="Minha Loja"
        />
      </Field>

      {isNew ? (
        <Field
          label="Endereço (URL)"
          hint="catalogo.shoppub.io/<endereço> — letras minúsculas, números e hífen"
        >
          <input
            name="slug"
            required
            className={inputCls}
            placeholder="minha-loja"
          />
        </Field>
      ) : (
        <Field label="Endereço (URL)" hint="o endereço não pode ser alterado">
          <input value={`catalogo.shoppub.io/${tenant.slug}`} disabled className={`${inputCls} opacity-60`} />
        </Field>
      )}

      <Field label="URL do feed XML">
        <input
          name="feedUrl"
          type="url"
          required
          defaultValue={tenant?.feedUrl}
          className={inputCls}
          placeholder="https://www.minhaloja.com.br/feed/todos-os-produtos/"
        />
      </Field>

      <Field label="WhatsApp" hint="só números, com DDI+DDD. Ex: 5511999999999">
        <input
          name="whatsapp"
          required
          defaultValue={tenant?.whatsapp}
          className={inputCls}
          placeholder="5511999999999"
        />
      </Field>

      <Field label="Cor principal">
        <input
          name="primaryColor"
          type="color"
          defaultValue={tenant?.primaryColor ?? "#4a3b2a"}
          className="h-10 w-16 rounded border border-black/15"
        />
      </Field>

      <Field
        label="Logo (opcional)"
        hint="PNG, JPG, GIF, WEBP, AVIF ou SVG — até 2 MB"
      >
        {tenant?.logo && (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tenant.logo}
              alt="Logo atual"
              className="h-10 w-auto rounded border border-black/10 bg-black/[0.03]"
            />
            <span className="text-xs text-black/40">
              logo atual — envie um arquivo para substituir
            </span>
          </div>
        )}
        <input
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-white file:text-sm hover:file:opacity-90"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="showPrice"
          defaultChecked={tenant?.showPrice}
          className="h-4 w-4"
        />
        Mostrar preços no catálogo (padrão: ocultos, “sob consulta”)
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-black text-white font-medium px-5 py-2.5 text-sm hover:opacity-90"
        >
          {isNew ? "Criar loja" : "Salvar alterações"}
        </button>
        <Link
          href="/admin/dashboard"
          className="text-sm text-black/50 hover:text-black"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-black/40 mt-1">{hint}</span>}
    </label>
  );
}
