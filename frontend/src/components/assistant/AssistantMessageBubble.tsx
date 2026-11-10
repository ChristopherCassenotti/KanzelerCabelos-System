import { CircleCheck, ExternalLink, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";
import { describePhotoUpload, type ChatMessage, type PhotoUploadJob, type RetryRequest } from "../../utils/assistant-chat";
import { PhotoThumbnails } from "./PhotoThumbnails";

interface AssistantMessageBubbleProps {
  message: ChatMessage;
  busy: boolean;
  onRetry: (request: RetryRequest) => void;
  onOpenContact: (contactId: string) => void;
  onRetryUploads?: (messageId: string, job: PhotoUploadJob) => void;
}

export function AssistantMessageBubble({ message, busy, onRetry, onOpenContact, onRetryUploads }: AssistantMessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {message.attachments && (
          <div className="flex max-w-[85%] justify-end sm:max-w-[70%]">
            <PhotoThumbnails photos={message.attachments} size="sm" />
          </div>
        )}
        {message.text && (
          <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[14px] rounded-br-[4px] bg-[var(--kanzler-blue)] px-3.5 py-2.5 text-[13.5px] leading-[1.45] text-white sm:max-w-[70%]">
            {message.text}
          </p>
        )}
      </div>
    );
  }

  if (message.tone === "success" && message.createdContact) {
    const contact = message.createdContact;
    const upload = message.photoUpload;
    const uploadSummary = upload ? describePhotoUpload(upload) : null;

    return (
      <div className="flex gap-2.5">
        <AssistantAvatar />
        <div
          role="status"
          className="min-w-0 max-w-[85%] rounded-[14px] rounded-tl-[4px] border border-[#bee6d2] bg-[var(--kanzler-green-soft)] px-3.5 py-3 text-[var(--kanzler-green)] sm:max-w-[70%]"
        >
          <p className="flex items-center gap-2 text-[13.5px] font-semibold">
            <CircleCheck size={16} className="shrink-0" />
            {message.text}
          </p>
          <p className="mt-1.5 break-words text-[13px] text-[var(--kanzler-ink)]">
            <strong>{contact.nome}</strong> · {contact.cidade.nome} - {contact.cidade.uf}
          </p>
          {upload && uploadSummary && (
            <div className="mt-2.5 space-y-2">
              <PhotoThumbnails photos={upload.photos} size="sm" showStatus />
              <p
                className={[
                  "text-[12px] font-medium",
                  uploadSummary.tone === "error" ? "text-[var(--kanzler-red)]" : "text-[var(--kanzler-ink)]",
                ].join(" ")}
              >
                {uploadSummary.text}
              </p>
              {uploadSummary.tone === "error" && onRetryUploads && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRetryUploads(message.id, upload)}
                  className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#f2caca] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[var(--kanzler-red)] transition hover:bg-[var(--kanzler-red-soft)] disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  Reenviar fotos
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpenContact(contact.id)}
            className="mt-3 inline-flex items-center gap-2 rounded-[10px] bg-[var(--kanzler-green)] px-3 py-2 text-[12.5px] font-semibold text-white transition hover:brightness-95"
          >
            <ExternalLink size={14} />
            Abrir ficha
          </button>
        </div>
      </div>
    );
  }

  const isError = message.tone === "error";

  return (
    <div className="flex gap-2.5">
      <AssistantAvatar />
      <div
        role={isError ? "alert" : undefined}
        className={[
          "min-w-0 max-w-[85%] rounded-[14px] rounded-tl-[4px] border px-3.5 py-2.5 text-[13.5px] leading-[1.45] sm:max-w-[70%]",
          isError
            ? "border-[#f2caca] bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]"
            : "border-[var(--kanzler-line)] bg-white text-[var(--kanzler-ink)]",
        ].join(" ")}
      >
        <p className="flex gap-2 whitespace-pre-wrap break-words">
          {isError && <TriangleAlert size={15} className="mt-0.5 shrink-0" />}
          <span>{message.text}</span>
        </p>

        {message.notices.length > 0 && (
          <ul className="mt-2 space-y-1 rounded-[10px] bg-[var(--kanzler-amber-soft)] px-3 py-2 text-[12px] text-[var(--kanzler-amber)]">
            {message.notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        )}

        {message.retry && (
          <button
            type="button"
            disabled={busy}
            onClick={() => message.retry && onRetry(message.retry)}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-[9px] border border-[#f2caca] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[var(--kanzler-red)] transition hover:bg-[var(--kanzler-red-soft)] disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}

export function AssistantAvatar() {
  return (
    <span
      aria-hidden="true"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--kanzler-blue)] to-[#5b8cff] text-white"
    >
      <Sparkles size={15} />
    </span>
  );
}
