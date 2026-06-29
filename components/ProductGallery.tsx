"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

// Pede uma versão maior da imagem ao CDN da Shoppub (1000 -> 2000) para o zoom.
function hiRes(url: string): string {
  return url.replace(/w=\d+,h=\d+/, "w=2000,h=2000");
}

export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };
  const close = useCallback(() => {
    setOpen(false);
    resetZoom();
  }, []);
  const go = useCallback(
    (dir: number) => {
      setActive((i) => (i + dir + images.length) % images.length);
      resetZoom();
    },
    [images.length]
  );

  // Esc / setas + trava o scroll do fundo enquanto a lightbox está aberta.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, go]);

  function toggleZoom() {
    if (scale === 1) setScale(2.2);
    else resetZoom();
  }

  // pan (mouse + toque) quando ampliado
  function onPointerDown(e: React.PointerEvent) {
    if (scale === 1) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  }
  function onPointerUp() {
    drag.current = null;
  }

  const multi = images.length > 1;

  return (
    <div>
      {/* Imagem principal */}
      <button
        type="button"
        onClick={() => images[active] && setOpen(true)}
        className="group relative block w-full aspect-square rounded-lg overflow-hidden bg-black/[0.03] border border-black/10 cursor-zoom-in"
        aria-label="Ampliar imagem"
      >
        {images[active] && (
          <Image
            src={images[active]}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-black/55 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Ampliar
        </span>
      </button>

      {/* Miniaturas */}
      {multi && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                i === active ? "border-primary" : "border-black/10"
              }`}
              aria-label={`Imagem ${i + 1}`}
            >
              <Image src={img} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center select-none"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Fechar"
            className="absolute top-3 right-4 text-white/80 hover:text-white text-3xl leading-none"
          >
            ×
          </button>

          {multi && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Anterior"
                className="absolute left-3 sm:left-6 text-white/70 hover:text-white text-4xl px-2"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Próxima"
                className="absolute right-3 sm:right-6 text-white/70 hover:text-white text-4xl px-2"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hiRes(images[active])}
            alt={title}
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              toggleZoom();
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              cursor: scale === 1 ? "zoom-in" : "grab",
              touchAction: scale === 1 ? "auto" : "none",
            }}
            className="max-h-[90vh] max-w-[92vw] object-contain transition-transform duration-150"
          />

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            Toque na imagem para {scale === 1 ? "ampliar" : "reduzir"}
            {multi ? ` · ${active + 1}/${images.length}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
