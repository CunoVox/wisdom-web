import { useEffect, useId, useRef, useState } from "react";
import { File, ImagePlus, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, mediaUrl } from "../lib/api";
import type { StoredFile } from "../types";
import { Hint } from "./hint";
import { MorphSymbol } from "./morph-symbol";

type FileUploadProps = {
  purpose: string;
  label?: string;
  description?: string;
  value?: string;
  kind?: "image" | "video" | "file";
  variant?: "default" | "cover";
  onUploaded: (file: StoredFile & { viewUrl?: string }) => void;
  onBusyChange?: (busy: boolean) => void;
};

export function FileUpload({
  purpose,
  onUploaded,
  label = "Tải file",
  description,
  value,
  kind = "image",
  variant = "default",
  onBusyChange,
}: FileUploadProps) {
  const [state, setState] = useState<"idle" | "uploading" | "saved" | "error">("idle");
  const [selected, setSelected] = useState<File>();
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | undefined>(undefined);
  const inputId = useId();
  const busy = state === "uploading";
  const coverVariant = variant === "cover" && kind === "image";

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!selected) return;
    const url = URL.createObjectURL(selected);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);
  useEffect(() => {
    const form = input.current?.form;
    const guard = (e: Event) => {
      if (!busy && state !== "error") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      toast.error(
        busy
          ? "File đang tải lên. Bạn có thể tiếp tục soạn và lưu khi tải xong."
          : "File chưa tải thành công. Vui lòng thử lại trước khi lưu.",
      );
    };
    form?.addEventListener("submit", guard, true);
    return () => form?.removeEventListener("submit", guard, true);
  }, [busy, state]);

  async function upload(file: File) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setState("uploading");
    setProgress(0);
    onBusyChange?.(true);

    const data = new FormData();
    data.append("file", file);

    try {
      const result = await api.post<StoredFile & { viewUrl?: string }>(
        `/files?purpose=${purpose}`,
        data,
        {
          signal: request.signal,
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress(
                Math.min(99, Math.round((e.loaded / e.total) * 100)),
              );
            }
          },
        },
      );
      if (request.signal.aborted) return;
      onUploaded(result.data);
      setState("saved");
    } catch (error) {
      if (request.signal.aborted) return;
      setState("error");
      toast.error(errorMessage(error));
    } finally {
      if (!request.signal.aborted) onBusyChange?.(false);
    }
  }

  function selectFile(file: File) {
    const accepted =
      kind === "video"
        ? file.type.startsWith("video/")
        : kind === "image"
          ? ["image/png", "image/jpeg", "image/webp"].includes(file.type)
          : true;

    if (!accepted) {
      toast.error(
        kind === "image"
          ? "Vui lòng chọn ảnh PNG, JPG hoặc WEBP."
          : kind === "video"
            ? "Vui lòng chọn một file video hợp lệ."
            : "Định dạng file không được hỗ trợ.",
      );
      return;
    }

    setSelected(file);
    void upload(file);
  }

  const src = preview || (value ? mediaUrl(value) : "");
  const mediaKind = selected
    ? selected.type.startsWith("image/")
      ? "image"
      : selected.type.startsWith("video/")
        ? "video"
        : "file"
    : kind;
  const saved = state === "saved" || (state === "idle" && Boolean(value));

  const fileInput = (
    <input
      id={inputId}
      ref={input}
      type="file"
      className={coverVariant ? "sr-only" : undefined}
      disabled={busy}
      accept={
        kind === "video"
          ? "video/*"
          : kind === "image"
            ? "image/png,image/jpeg,image/webp"
            : undefined
      }
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) selectFile(file);
      }}
    />
  );

  if (coverVariant) {
    return (
      <div className="media-upload cover-upload">
        <div className="cover-upload-heading">
          <div>
            <label className="cover-upload-title" htmlFor={inputId}>
              {label}
            </label>
            <p>
              {description ||
                "Ảnh này xuất hiện ở trang khám phá và trang chi tiết khóa học."}
            </p>
          </div>
        </div>

        {fileInput}

        <div
          className={`media-preview cover-media-preview ${src ? "has-media" : ""} ${dragActive ? "drag-active" : ""}`}
          aria-busy={busy}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!busy) setDragActive(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragActive(true);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setDragActive(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (busy) return;
            const file = e.dataTransfer.files?.[0];
            if (file) selectFile(file);
          }}
        >
          {src ? (
            <img src={src} alt={selected?.name || label} />
          ) : (
            <div className="cover-upload-placeholder">
              <span className="cover-upload-icon" aria-hidden="true">
                <ImagePlus size={30} />
              </span>
              <strong>Thêm ảnh bìa khóa học</strong>
              <span>Kéo thả ảnh vào đây hoặc chọn ảnh từ máy</span>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                <Upload size={16} />
                Chọn ảnh
              </button>
            </div>
          )}

          {busy && (
            <span className="media-upload-status" role="status">
              <LoaderCircle className="animate-spin" size={20} />
              Đang tải {progress}%
            </span>
          )}
          {saved && (
            <Hint label="Đã lưu trữ hệ thống">
              <span
                className="media-upload-success"
                tabIndex={0}
                role="img"
                aria-label="Đã lưu trữ hệ thống"
              >
                <MorphSymbol kind="upload" active={saved} size={23} />
              </span>
            </Hint>
          )}
        </div>

        <div className="cover-upload-footer">
          <div className="cover-upload-guides" aria-label="Hướng dẫn ảnh bìa">
            <span><strong>16:9</strong>Tỷ lệ hiển thị</span>
            <span><strong>1280 × 720</strong>Kích thước khuyến nghị</span>
            <span><strong>PNG · JPG · WEBP</strong>Định dạng hỗ trợ</span>
          </div>

          {src && (
            <div className="cover-upload-actions">
              <div className="min-w-0">
                <strong>{selected ? selected.name : "Ảnh bìa hiện tại"}</strong>
                <small>Ảnh sẽ được cắt vừa khung 16:9 khi hiển thị.</small>
              </div>
              <button
                type="button"
                className="secondary shrink-0"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                <Upload size={16} />
                Thay ảnh
              </button>
            </div>
          )}
        </div>

        {state === "error" && (
          <div role="alert" className="media-upload-error">
            Tải ảnh chưa thành công.{" "}
            <button
              type="button"
              className="secondary"
              onClick={() => selected && void upload(selected)}
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="media-upload">
      <label className="media-upload-label" htmlFor={inputId}>
        {label}
        {fileInput}
      </label>
      {selected && <small className="break-words">{selected.name}</small>}
      <div
        className={`media-preview ${purpose === "AVATAR" ? "avatar-preview" : ""}`}
        aria-busy={busy}
      >
        {src ? (
          mediaKind === "image" ? (
            <img src={src} alt={selected?.name || label} />
          ) : mediaKind === "video" ? (
            <video src={src} controls preload="metadata" />
          ) : (
            <span className="media-file">
              <File size={28} />
              {selected?.name || "Tài liệu đã tải lên"}
            </span>
          )
        ) : (
          <span className="media-placeholder">
            {kind === "video"
              ? "Chọn video để xem trước"
              : kind === "image"
                ? "Chọn ảnh để xem trước"
                : "Chọn tài liệu"}
          </span>
        )}
        {busy && (
          <span className="media-upload-status" role="status">
            <LoaderCircle className="animate-spin" size={20} />
            Đang tải {progress}%
          </span>
        )}
        {saved && (
          <Hint label="Đã lưu trữ hệ thống">
            <span
              className="media-upload-success"
              tabIndex={0}
              role="img"
              aria-label="Đã lưu trữ hệ thống"
            >
              <MorphSymbol kind="upload" active={saved} size={23} />
            </span>
          </Hint>
        )}
      </div>
      {state === "error" && (
        <div role="alert" className="media-upload-error">
          Tải file chưa thành công.{" "}
          <button
            type="button"
            className="secondary"
            onClick={() => selected && void upload(selected)}
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
