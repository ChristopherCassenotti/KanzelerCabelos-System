import { CircleCheck, LoaderCircle, TriangleAlert, X } from "lucide-react";
import type { AssistantPhoto } from "../../types/assistant";

interface PhotoThumbnailsProps {
  photos: AssistantPhoto[];
  size?: "sm" | "md";
  showStatus?: boolean;
  disabled?: boolean;
  onRemove?: (photoId: string) => void;
}

export function PhotoThumbnails({ photos, size = "md", showStatus = false, disabled = false, onRemove }: PhotoThumbnailsProps) {
  if (photos.length === 0) return null;

  const box = size === "sm" ? "h-14 w-14" : "h-[72px] w-[72px]";

  return (
    <ul className="flex flex-wrap gap-2">
      {photos.map((photo, index) => (
        <li key={photo.id} className={`relative ${box} shrink-0 overflow-hidden rounded-[10px] border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)]`}>
          <img src={photo.previewUrl} alt={`Foto ${index + 1} do cabelo`} className="h-full w-full object-cover" />

          {showStatus && photo.status !== "pending" && (
            <span
              className={[
                "absolute inset-x-0 bottom-0 grid place-items-center py-0.5 text-white",
                photo.status === "failed" ? "bg-[var(--kanzler-red)]" : photo.status === "uploaded" ? "bg-[var(--kanzler-green)]" : "bg-[rgba(14,26,43,0.6)]",
              ].join(" ")}
            >
              {photo.status === "uploading" && <LoaderCircle size={12} className="animate-spin" aria-label="Enviando" />}
              {photo.status === "uploaded" && <CircleCheck size={12} aria-label="Enviada" />}
              {photo.status === "failed" && <TriangleAlert size={12} aria-label="Falhou" />}
            </span>
          )}

          {onRemove && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(photo.id)}
              aria-label={`Remover foto ${index + 1}`}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-[rgba(14,26,43,0.72)] text-white transition hover:bg-[var(--kanzler-navy)] disabled:opacity-50"
            >
              <X size={13} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
