"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">Catálogo indisponível no momento</h1>
      <p className="mt-2 text-foreground/60">
        Não conseguimos carregar os produtos agora. Tente novamente em instantes.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-primary text-white px-5 py-2 text-sm font-medium hover:opacity-90"
      >
        Tentar de novo
      </button>
    </div>
  );
}
