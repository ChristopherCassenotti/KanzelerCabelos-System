import { ImagePlus, LoaderCircle, MapPin, MessageSquarePlus, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AssistantAvatar, AssistantMessageBubble } from "../components/assistant/AssistantMessageBubble";
import { ContactDraftCard } from "../components/assistant/ContactDraftCard";
import { PhotoThumbnails } from "../components/assistant/PhotoThumbnails";
import { createAttachedPhoto, useAssistantChat } from "../hooks/useAssistantChat";
import type { AssistantPhoto } from "../types/assistant";
import {
  ASSISTANT_MAX_PHOTOS,
  ASSISTANT_MESSAGE_MAX_LENGTH,
  ASSISTANT_PHOTO_TYPES,
  canSendMessage,
  getContactProfilePath,
  isDraftReady,
  validatePhotoSelection,
} from "../utils/assistant-chat";

export function AssistantPage() {
  const navigate = useNavigate();
  const { state, sendMessage, chooseCity, confirm, retry, retryUploads, removePhoto, edit, cancel, reset } =
    useAssistantChat();
  const [text, setText] = useState("");
  // Fotos escolhidas no campo de mensagem, enviadas junto com o próximo texto.
  const [composerPhotos, setComposerPhotos] = useState<AssistantPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerPhotosRef = useRef(composerPhotos);
  composerPhotosRef.current = composerPhotos;

  const busy = state.status !== "idle";
  const draftReady = isDraftReady(state);
  const canSend = canSendMessage(state, text, composerPhotos.length);
  const totalPhotos = state.photos.length + composerPhotos.length;
  const remaining = ASSISTANT_MESSAGE_MAX_LENGTH - text.length;

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [state.messages.length, state.status, draftReady, state.cityOptions.length]);

  useEffect(() => {
    if (state.editing) inputRef.current?.focus();
  }, [state.editing]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }, [text]);

  useEffect(
    () => () => {
      for (const photo of composerPhotosRef.current) URL.revokeObjectURL(photo.previewUrl);
    },
    [],
  );

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;

    const message = text;
    const attachments = composerPhotos;
    setText("");
    setComposerPhotos([]);
    setPhotoError(null);
    void sendMessage(message, attachments);
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const { accepted, errors } = validatePhotoSelection(files, totalPhotos);
    setPhotoError(errors.length > 0 ? errors.join(" ") : null);
    setComposerPhotos((current) => [...current, ...accepted.map(createAttachedPhoto)]);
    inputRef.current?.focus();
  }

  function removeComposerPhoto(photoId: string) {
    setComposerPhotos((current) => {
      const removed = current.find((photo) => photo.id === photoId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== photoId);
    });
    setPhotoError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function openContact(contactId: string) {
    navigate(getContactProfilePath(contactId));
  }

  function startNewConversation() {
    if (busy) return;
    reset();
    for (const photo of composerPhotos) URL.revokeObjectURL(photo.previewUrl);
    setComposerPhotos([]);
    setPhotoError(null);
    setText("");
    inputRef.current?.focus();
  }

  return (
    <section
      aria-label="Assistente IA"
      className="mx-auto flex h-[calc(100dvh-168px)] min-h-[440px] max-w-[920px] flex-col overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-[var(--kanzler-card)] shadow-[var(--kanzler-shadow)] sm:h-[calc(100dvh-134px)]"
    >
      <header className="flex items-center gap-3 border-b border-[var(--kanzler-line)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="kanzler-display truncate text-[15px] font-bold text-[var(--kanzler-ink)]">Cadastro por mensagem</h2>
          <p className="truncate text-[11.5px] text-[var(--kanzler-muted)]">Nada é salvo sem a sua confirmação</p>
        </div>

        <button
          type="button"
          onClick={startNewConversation}
          disabled={busy}
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-2.5 py-2 text-[12.5px] font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
        >
          <MessageSquarePlus size={15} />
          <span className="hidden min-[380px]:inline">Nova conversa</span>
        </button>
      </header>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-3 overflow-y-auto bg-[var(--kanzler-canvas)] px-3 py-4 sm:px-5"
      >
        {state.messages.map((message) => (
          <AssistantMessageBubble
            key={message.id}
            message={message}
            busy={busy}
            onRetry={(request) => void retry(request)}
            onOpenContact={openContact}
            onRetryUploads={(messageId, job) => void retryUploads(messageId, job)}
          />
        ))}

        {state.cityOptions.length > 0 && !busy && (
          <div className="ml-0 flex flex-wrap gap-2 sm:ml-[42px]" role="group" aria-label="Escolha a cidade">
            {state.cityOptions.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => void chooseCity(city)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd8f7] bg-[var(--kanzler-blue-soft)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--kanzler-blue)] transition hover:bg-white"
              >
                <MapPin size={13} />
                {city.nome} - {city.uf}
              </button>
            ))}
          </div>
        )}

        {draftReady && state.draft && (
          <ContactDraftCard
            draft={state.draft}
            duplicates={state.duplicates}
            photos={state.photos}
            confirming={state.status === "confirming"}
            disabled={busy}
            onConfirm={() => void confirm()}
            onEdit={edit}
            onCancel={cancel}
            onOpenContact={openContact}
            onRemovePhoto={removePhoto}
          />
        )}

        {busy && (
          <div className="flex items-center gap-2.5" role="status">
            <AssistantAvatar />
            <span className="inline-flex items-center gap-2 rounded-[14px] border border-[var(--kanzler-line)] bg-white px-3.5 py-2.5 text-[12.5px] text-[var(--kanzler-muted)]">
              <LoaderCircle size={14} className="animate-spin" />
              {state.status === "confirming"
                ? "Cadastrando contato..."
                : state.status === "uploading"
                  ? "Enviando fotos..."
                  : "Interpretando..."}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-[var(--kanzler-line)] bg-white px-3 py-3 sm:px-4">
        {composerPhotos.length > 0 && (
          <div className="mb-2">
            <PhotoThumbnails photos={composerPhotos} size="sm" onRemove={removeComposerPhoto} />
          </div>
        )}
        {photoError && (
          <p role="alert" className="mb-2 text-[12px] font-medium text-[var(--kanzler-red)]">
            {photoError}
          </p>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ASSISTANT_PHOTO_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={totalPhotos >= ASSISTANT_MAX_PHOTOS}
            aria-label={`Anexar fotos do cabelo (${totalPhotos} de ${ASSISTANT_MAX_PHOTOS})`}
            title="Anexar fotos do cabelo"
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[10px] border border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)] transition hover:bg-[var(--kanzler-canvas)] hover:text-[var(--kanzler-ink)] disabled:opacity-50"
          >
            <ImagePlus size={18} />
          </button>
          <label htmlFor="assistant-input" className="sr-only">
            Mensagem para o assistente
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, ASSISTANT_MESSAGE_MAX_LENGTH))}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={ASSISTANT_MESSAGE_MAX_LENGTH}
            placeholder={state.editing ? "Diga o que deseja alterar..." : "Ex.: Comprei o cabelo da Mariana Silva, de Porto União, R$ 900 no Pix..."}
            className="max-h-[140px] min-h-[42px] flex-1 resize-none rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[13.5px] leading-[1.4] text-[var(--kanzler-ink)] outline-none transition placeholder:text-[var(--kanzler-muted-2)] focus:border-[var(--kanzler-blue)] focus:ring-2 focus:ring-[var(--kanzler-blue-soft)]"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Enviar mensagem"
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[10px] bg-[var(--kanzler-blue)] text-white transition hover:bg-[var(--kanzler-blue-dark)] disabled:opacity-50"
          >
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <SendHorizontal size={17} />}
          </button>
        </div>
        <p className="mt-1.5 flex justify-between gap-2 text-[11px] text-[var(--kanzler-muted-2)]">
          <span className="hidden sm:inline">Enter envia · Shift + Enter quebra linha · até {ASSISTANT_MAX_PHOTOS} fotos</span>
          {remaining <= 200 && <span className="ml-auto">{remaining} caracteres restantes</span>}
        </p>
      </form>
    </section>
  );
}
