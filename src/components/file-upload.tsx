import { useEffect, useRef, useState } from "react";
import { CheckCircle2, File, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, mediaUrl } from "../lib/api";
import type { StoredFile } from "../types";
import { Hint } from "./hint";
import { MorphSymbol } from "./morph-symbol";

export function FileUpload({ purpose, onUploaded, label = "Tải file", value, kind = "image", onBusyChange }: {
  purpose: string; label?: string; value?: string; kind?: "image" | "video" | "file";
  onUploaded: (file: StoredFile & { viewUrl?: string }) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [state, setState] = useState<"idle" | "uploading" | "saved" | "error">("idle");
  const [selected, setSelected] = useState<File>();
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | undefined>(undefined);
  const busy = state === "uploading";
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!selected) return;
    const url = URL.createObjectURL(selected); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);
  useEffect(() => {
    const form = input.current?.form;
    const guard = (e: Event) => {
      if (!busy && state !== "error") return;
      e.preventDefault(); e.stopImmediatePropagation();
      toast.error(busy ? "File đang tải lên. Bạn có thể tiếp tục soạn và lưu khi tải xong." : "File chưa tải thành công. Vui lòng thử lại trước khi lưu.");
    };
    form?.addEventListener("submit", guard, true);
    return () => form?.removeEventListener("submit", guard, true);
  }, [busy, state]);
  async function upload(file: File) {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setState("uploading"); setProgress(0); onBusyChange?.(true);
    const data = new FormData(); data.append("file", file);
    try {
      const result = await api.post<StoredFile & { viewUrl?: string }>(`/files?purpose=${purpose}`, data, {
        signal: request.signal,
        onUploadProgress: e => { if (e.total) setProgress(Math.min(99, Math.round(e.loaded / e.total * 100))); },
      });
      if (request.signal.aborted) return;
      onUploaded(result.data); setState("saved");
    } catch (error) {
      if (request.signal.aborted) return;
      setState("error"); toast.error(errorMessage(error));
    } finally { if (!request.signal.aborted) onBusyChange?.(false); }
  }
  const src = preview || (value ? mediaUrl(value) : "");
  const mediaKind = selected ? (selected.type.startsWith("image/") ? "image" : selected.type.startsWith("video/") ? "video" : "file") : kind;
  const saved = state === "saved" || (state === "idle" && Boolean(value));
  return <div className="media-upload">
    <label className="media-upload-label">{label}
      <input ref={input} type="file" disabled={busy}
        accept={kind === "video" ? "video/*" : kind === "image" ? "image/png,image/jpeg,image/webp" : undefined}
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file) { setSelected(file); void upload(file); } }} />
    </label>
    {selected && <small className="break-words">{selected.name}</small>}
    <div className={`media-preview ${purpose === "AVATAR" ? "avatar-preview" : ""}`} aria-busy={busy}>
      {src ? mediaKind === "image" ? <img src={src} alt={selected?.name || label} />
        : mediaKind === "video" ? <video src={src} controls preload="metadata" />
        : <span className="media-file"><File size={28} />{selected?.name || "Tài liệu đã tải lên"}</span>
        : <span className="media-placeholder">{kind === "video" ? "Chọn video để xem trước" : kind === "image" ? "Chọn ảnh để xem trước" : "Chọn tài liệu"}</span>}
      {busy && <span className="media-upload-status" role="status"><LoaderCircle className="animate-spin" size={20} />Đang tải {progress}%</span>}
      {saved && <Hint label="Đã lưu trữ hệ thống"><span className="media-upload-success" tabIndex={0} role="img" aria-label="Đã lưu trữ hệ thống"><MorphSymbol kind="upload" active={saved} size={23} /></span></Hint>}
    </div>
    {state === "error" && <div role="alert" className="media-upload-error">Tải file chưa thành công. <button type="button" className="secondary" onClick={() => selected && void upload(selected)}>Thử lại</button></div>}
  </div>;
}
