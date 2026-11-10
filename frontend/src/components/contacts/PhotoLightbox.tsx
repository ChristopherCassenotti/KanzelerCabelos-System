import { ChevronLeft, ChevronRight, ImageOff, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContactPhoto, ContactPurchase } from "../../types/contact";
import { formatCurrency, formatDate } from "../../utils/contact";

interface PhotoLightboxProps {
  photos: ContactPhoto[];
  initialIndex: number;
  purchases: ContactPurchase[];
  deleting?: boolean;
  keyboardDisabled?: boolean;
  onClose: () => void;
  onDelete: (photo: ContactPhoto) => void;
}

function purchaseDescription(photo: ContactPhoto, purchases: ContactPurchase[]) {
  if (!photo.compraId) return null;
  const purchase = purchases.find((item) => item.id === photo.compraId);
  if (!purchase) return "Vinculada a uma compra";
  return `Corte de ${formatDate(purchase.dataCorte)} · ${formatCurrency(purchase.valorPago)}`;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  purchases,
  deleting = false,
  keyboardDisabled = false,
  onClose,
  onDelete,
}: PhotoLightboxProps) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(initialIndex, photos.length - 1)));
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
  }, [initialIndex, photos.length]);

  const photo = photos[index];

  useEffect(() => {
    setImageFailed(false);
  }, [photo?.signedUrl]);

  useEffect(() => {
    if (keyboardDisabled) return;

    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && photos.length > 1) {
        setIndex((current) => (current - 1 + photos.length) % photos.length);
      }
      if (event.key === "ArrowRight" && photos.length > 1) {
        setIndex((current) => (current + 1) % photos.length);
      }
    };

    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [keyboardDisabled, onClose, photos.length]);

  if (!photo) return null;

  const purchase = purchaseDescription(photo, purchases);

  return (
    <div className="fixed inset-0 z-[1550] flex flex-col bg-[#07111f]/95 text-white" role="dialog" aria-modal="true" aria-label="Visualização da foto">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="kanzler-display truncate text-sm font-semibold">{photo.tipo || "Foto da cliente"}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/55">{purchase || `${index + 1} de ${photos.length}`}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(photo)}
          disabled={deleting}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-xs font-semibold text-[#ffb4b4] hover:bg-white/10 disabled:opacity-40"
        >
          <Trash2 size={15} />
          <span className="hidden sm:inline">Excluir</span>
        </button>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/80 hover:bg-white/10" aria-label="Fechar visualização">
          <X size={19} />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((current) => (current - 1 + photos.length) % photos.length)}
            className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55 sm:left-6"
            aria-label="Foto anterior"
          >
            <ChevronLeft size={25} />
          </button>
        )}

        {photo.signedUrl && !imageFailed ? (
          <img
            src={photo.signedUrl}
            alt={photo.tipo || "Foto da cliente"}
            onError={() => setImageFailed(true)}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
        ) : (
          <div className="grid min-h-64 w-full max-w-lg place-items-center rounded-2xl border border-white/10 bg-white/5 text-center text-white/55">
            <div>
              <ImageOff size={34} className="mx-auto mb-3" />
              <p className="text-sm font-medium">Não foi possível carregar esta imagem.</p>
              <p className="mt-1 text-xs text-white/40">Atualize os links assinados na galeria e tente novamente.</p>
            </div>
          </div>
        )}

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % photos.length)}
            className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55 sm:right-6"
            aria-label="Próxima foto"
          >
            <ChevronRight size={25} />
          </button>
        )}
      </div>

      <footer className="flex items-center justify-center gap-1.5 border-t border-white/10 px-4 py-3">
        {photos.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(itemIndex)}
            className={`h-2 rounded-full transition-all ${itemIndex === index ? "w-7 bg-white" : "w-2 bg-white/30 hover:bg-white/60"}`}
            aria-label={`Abrir foto ${itemIndex + 1}`}
          />
        ))}
      </footer>
    </div>
  );
}
