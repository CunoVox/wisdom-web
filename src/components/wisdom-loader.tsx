import { useEffect } from "react";

// Mascot and ring treatment from the original Wisdom SpinnerCustom.
export function WisdomLoader({ fullscreen = false, label = "Đang tải dữ liệu…" }: { fullscreen?: boolean; label?: string }) {
  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [fullscreen]);
  return <div className={fullscreen ? "wisdom-loader fullscreen" : "wisdom-loader"} role="status" aria-live="polite">
    <div className="wisdom-loader-mark" aria-hidden="true"><span /><img src="/wisdom-loader.svg" alt="" /></div>
    <span className="wisdom-loader-label">{label}</span>
  </div>;
}
