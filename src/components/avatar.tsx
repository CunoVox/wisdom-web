import { useState } from "react";
import { mediaUrl } from "../lib/api";

export function Avatar({ name, avatarId, className = "", decorative = false }: {
  name: string;
  avatarId?: string | null;
  className?: string;
  decorative?: boolean;
}) {
  const src = avatarId ? mediaUrl(avatarId) : undefined;
  const [failedSrc, setFailedSrc] = useState<string>();
  return <span className={`user-avatar ${className}`} aria-hidden={decorative || undefined}
    role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `Ảnh đại diện của ${name}`}>
    {src && src !== failedSrc
      ? <img key={src} src={src} alt="" onError={() => setFailedSrc(src)} />
      : (Array.from(name.trim())[0] || "?").toLocaleUpperCase("vi-VN")}
  </span>;
}
