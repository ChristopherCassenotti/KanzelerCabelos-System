import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  Image as ImageIcon,
  ImageOff,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteContactPhoto, listContactPhotos, uploadContactPhoto } from "../../services/photos/photos.service";
import type { ContactDetail, ContactPhoto } from "../../types/contact";
import { formatCurrency, formatDate } from "../../utils/contact";
import { ConfirmDialog } from "./ConfirmDialog";
import { PhotoLightbox } from "./PhotoLightbox";

const MAX_FILES = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const PHOTO_TYPES = [
  { value: "", label: "Sem tipo" },
  { value: "frente", label: "Frente" },
  { value: "costas", label: "Costas" },
  { value: "lateral", label: "Lateral" },
  { value: "comprimento", label: "Comprimento" },
  { value: "detalhe", label: "Detalhe" },
  { value: "antes", label: "Antes" },
  { value: "depois", label: "Depois" },
] as const;

interface ContactPhotosSectionProps {
  contact: ContactDetail;
  onRequestAuthorization: () => void;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function photoPurchaseLabel(photo: ContactPhoto, contact: ContactDetail) {
  if (!photo.compraId) return null;
  const purchase = contact.compras.find((item) => item.id === photo.compraId);
  if (!purchase) return "Compra vinculada";
  return `Corte ${formatDate(purchase.dataCorte)}`;
}

function PhotoImage({ photo, onClick }: { photo: ContactPhoto; onClick: () => void }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photo.signedUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] text-left"
    >
      {photo.signedUrl && !failed ? (
        <img
          src={photo.signedUrl}
          alt={photo.tipo || "Foto da cliente"}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.035]"
        />
      ) : (
        <span className="grid h-full place-items-center text-[var(--kanzler-muted-2)]">
          <ImageOff size={22} />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-[10px] font-semibold text-white">
        {photo.tipo || "Foto"}
      </span>
    </button>
  );
}

export function ContactPhotosSection({ contact, onRequestAuthorization }: ContactPhotosSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [photoType, setPhotoType] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const completedUploadsRef = useRef(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<ContactPhoto | null>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
    setFiles([]);
    setPhotoType("");
    setPurchaseId("");
    setSelectionError(null);
    setFeedback(null);
    setUploadProgress(0);
    setLightboxIndex(null);
    setPhotoToDelete(null);
  }, [contact.id]);

const photosQuery = useQuery({
  queryKey: [
    "contacts",
    "photos",
    contact.id,
  ],

  queryFn: () =>
    listContactPhotos(
      contact.id,
    ),

  placeholderData:
    contact.fotos,

  staleTime:
    45 * 60_000,

  refetchOnMount:
    "always",

  refetchInterval:
    50 * 60_000,
});

  const photos = photosQuery.data ?? [];

  async function refreshContactPhotos() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["contacts", "photos", contact.id] }),
      queryClient.invalidateQueries({ queryKey: ["contacts", "detail", contact.id] }),
    ]);
  }

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (files.length === 0) return [];

      const created: ContactPhoto[] = [];
      completedUploadsRef.current = 0;
      setUploadProgress(0);

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const uploaded = await uploadContactPhoto(
          contact.id,
          {
            file,
            ...(photoType ? { tipo: photoType } : {}),
            ...(purchaseId ? { compraId: purchaseId } : {}),
          },
          (progress) => {
            const total = Math.round(((index + progress / 100) / files.length) * 100);
            setUploadProgress(Math.min(100, total));
          },
        );
        created.push(uploaded);
        completedUploadsRef.current = index + 1;
        setUploadProgress(Math.round(((index + 1) / files.length) * 100));
      }

      return created;
    },
    onSuccess: async (created) => {
      await refreshContactPhotos();
      setFiles([]);
      setPhotoType("");
      setPurchaseId("");
      completedUploadsRef.current = 0;
      setUploadProgress(0);
      setSelectionError(null);
      setFeedback(created.length === 1 ? "Foto enviada com sucesso." : `${created.length} fotos enviadas com sucesso.`);
    },
    onError: async (error) => {
      const completed = completedUploadsRef.current;
      await refreshContactPhotos();
      if (completed > 0) {
        setFiles((current) => current.slice(completed));
      }
      completedUploadsRef.current = 0;
      setUploadProgress(0);
      setFeedback(
        completed > 0
          ? `Falha no upload: ${errorMessage(error)}. ${completed} foto(s) já concluída(s) foram mantidas; restaram ${Math.max(0, files.length - completed)} para tentar novamente.`
          : `Falha no upload: ${errorMessage(error)}.`,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteContactPhoto(contact.id, photoId),
    onSuccess: async () => {
      setPhotoToDelete(null);
      setLightboxIndex(null);
      await refreshContactPhotos();
      setFeedback("Foto excluída.");
    },
    onError: (error) => {
      setPhotoToDelete(null);
      setFeedback(errorMessage(error));
    },
  });

  function handleFiles(selected: FileList | null) {
    if (!selected) return;

    const next = Array.from(selected);
    setSelectionError(null);
    setFeedback(null);

    if (next.length > MAX_FILES) {
      setFiles([]);
      setSelectionError(`Selecione no máximo ${MAX_FILES} fotos por envio.`);
      return;
    }

    const invalidType = next.find((file) => !ACCEPTED_TYPES.has(file.type));
    if (invalidType) {
      setFiles([]);
      setSelectionError(`${invalidType.name}: formato não permitido. Use JPEG, PNG ou WebP.`);
      return;
    }

    const oversized = next.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setFiles([]);
      setSelectionError(`${oversized.name}: arquivo maior que 10 MiB.`);
      return;
    }

    setFiles(next);
  }

  function removeSelectedFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setSelectionError(null);
  }

  const isUploading = uploadMutation.isPending;
  const purchaseOptions = [...contact.compras].sort((a, b) => b.dataCorte.localeCompare(a.dataCorte));

  return (
    <section className="border-b border-[var(--kanzler-line)] py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="kanzler-display text-sm font-semibold">Fotos privadas</h3>
          <p className="mt-1 text-[11.5px] text-[var(--kanzler-muted-2)]">
            {photos.length} foto(s) · links temporários e protegidos
          </p>
        </div>
        <button
          type="button"
          onClick={() => photosQuery.refetch()}
          disabled={photosQuery.isFetching}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--kanzler-line)] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
        >
          <RefreshCw size={13} className={photosQuery.isFetching ? "animate-spin" : ""} />
          Atualizar links
        </button>
      </div>

      {!contact.autorizouFoto ? (
        <div className="mt-3 rounded-xl border border-[#f1d7aa] bg-[var(--kanzler-amber-soft)] p-4">
          <div className="flex gap-3">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-[var(--kanzler-amber)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[var(--kanzler-ink)]">Upload bloqueado: autorização de fotos não registrada.</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--kanzler-muted)]">O backend também recusa o envio enquanto <code>autorizouFoto</code> estiver desativado.</p>
              <button type="button" onClick={onRequestAuthorization} className="mt-3 rounded-[8px] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--kanzler-amber)] shadow-sm hover:bg-[#fffaf0]">
                Editar contato e registrar autorização
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] p-3.5">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-[9px] border border-[#c9d8ff] bg-[var(--kanzler-blue-soft)] px-3 py-2.5 text-[12px] font-semibold text-[var(--kanzler-blue)] hover:bg-[#dfe8ff] disabled:opacity-50"
            >
              <Camera size={15} /> Selecionar fotos
            </button>
            <p className="text-[11px] leading-4 text-[var(--kanzler-muted)]">JPEG, PNG ou WebP · até 4 arquivos · 10 MiB por foto.</p>
          </div>

          {files.length > 0 && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {previews.map(({ file, url }, index) => (
                  <div key={`${file.name}-${file.lastModified}`} className="relative overflow-hidden rounded-xl border border-[var(--kanzler-line)] bg-white">
                    <img src={url} alt={file.name} className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      disabled={isUploading}
                      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/75 disabled:opacity-50"
                      aria-label={`Remover ${file.name}`}
                    >
                      <X size={14} />
                    </button>
                    <div className="px-2 py-2">
                      <p className="truncate text-[10.5px] font-semibold">{file.name}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--kanzler-muted-2)]">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-[11px] font-semibold text-[var(--kanzler-muted)]">
                  Tipo das fotos
                  <select
                    value={photoType}
                    onChange={(event) => setPhotoType(event.target.value)}
                    disabled={isUploading}
                    className="mt-1.5 w-full rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[12px] font-medium text-[var(--kanzler-ink)] outline-none focus:border-[var(--kanzler-blue)]"
                  >
                    {PHOTO_TYPES.map((item) => <option key={item.value || "none"} value={item.value}>{item.label}</option>)}
                  </select>
                </label>

                <label className="text-[11px] font-semibold text-[var(--kanzler-muted)]">
                  Vincular à compra (opcional)
                  <select
                    value={purchaseId}
                    onChange={(event) => setPurchaseId(event.target.value)}
                    disabled={isUploading}
                    className="mt-1.5 w-full rounded-[9px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[12px] font-medium text-[var(--kanzler-ink)] outline-none focus:border-[var(--kanzler-blue)] disabled:bg-[var(--kanzler-canvas)]"
                  >
                    <option value="">Sem compra vinculada</option>
                    {purchaseOptions.map((purchase) => (
                      <option key={purchase.id} value={purchase.id}>
                        {formatDate(purchase.dataCorte)} · {formatCurrency(purchase.valorPago)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isUploading && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10.5px] font-semibold text-[var(--kanzler-muted)]">
                    <span className="inline-flex items-center gap-1.5"><LoaderCircle size={12} className="animate-spin" /> Enviando...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[var(--kanzler-blue)] transition-[width]" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => uploadMutation.mutate()}
                disabled={isUploading || files.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[9px] bg-[var(--kanzler-blue)] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[var(--kanzler-blue-dark)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Upload size={15} /> {isUploading ? "Enviando fotos..." : `Enviar ${files.length} foto${files.length === 1 ? "" : "s"}`}
              </button>
            </div>
          )}
        </div>
      )}

      {selectionError && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-[var(--kanzler-red-soft)] px-3 py-2 text-[11.5px] text-[var(--kanzler-red)]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {selectionError}
        </div>
      )}

      {feedback && (
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-[var(--kanzler-canvas)] px-3 py-2 text-[11.5px] text-[var(--kanzler-muted)]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> {feedback}
        </div>
      )}

      {photosQuery.isError && (
        <div className="mt-3 rounded-xl bg-[var(--kanzler-red-soft)] p-4 text-center text-[12px] text-[var(--kanzler-red)]">
          {errorMessage(photosQuery.error)}
        </div>
      )}

      {photosQuery.isLoading ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-square animate-pulse rounded-xl bg-[var(--kanzler-canvas)]" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="mt-3 rounded-xl bg-[var(--kanzler-canvas)] px-4 py-7 text-center text-sm text-[var(--kanzler-muted)]">
          <ImageIcon size={23} className="mx-auto mb-2 text-[var(--kanzler-muted-2)]" />
          Nenhuma foto cadastrada.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => {
            const purchaseLabel = photoPurchaseLabel(photo, contact);
            return (
              <div key={photo.id} className="min-w-0">
                <PhotoImage photo={photo} onClick={() => setLightboxIndex(index)} />
                <div className="mt-1.5 flex items-start justify-between gap-1">
                  <p className="min-w-0 truncate text-[9.5px] text-[var(--kanzler-muted-2)]">{purchaseLabel || "Sem compra vinculada"}</p>
                  <button
                    type="button"
                    onClick={() => setPhotoToDelete(photo)}
                    disabled={deleteMutation.isPending}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--kanzler-muted-2)] hover:bg-[var(--kanzler-red-soft)] hover:text-[var(--kanzler-red)]"
                    aria-label="Excluir foto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          purchases={contact.compras}
          deleting={deleteMutation.isPending}
          keyboardDisabled={Boolean(photoToDelete)}
          onClose={() => setLightboxIndex(null)}
          onDelete={(photo) => setPhotoToDelete(photo)}
        />
      )}

      <ConfirmDialog
        open={Boolean(photoToDelete)}
        title="Excluir foto?"
        description="O arquivo será removido do armazenamento privado e também do banco de dados. Essa ação não pode ser desfeita."
        confirmLabel="Excluir foto"
        destructive
        pending={deleteMutation.isPending}
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={() => photoToDelete && deleteMutation.mutate(photoToDelete.id)}
      />
    </section>
  );
}
