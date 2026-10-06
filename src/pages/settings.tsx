import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, CloudUpload, CreditCard, ShieldCheck } from "lucide-react";
import { get } from "../lib/api";
import { Field, Heading, State, useAction } from "../components/ui";
import { EmailJobs } from "../components/email-jobs";
type Kind = "SMTP" | "HAOBOX" | "VNPAY";
type Setting = {
  kind: Kind;
  enabled: boolean;
  configured: boolean;
  hasSecret: boolean;
  config: Record<string, string>;
};
const fields: Record<
  Kind,
  {
    key: string;
    label: string;
    type?: string;
    hint?: string;
    options?: string[];
  }[]
> = {
  SMTP: [
    { key: "host", label: "SMTP host" },
    { key: "port", label: "Port", type: "number" },
    { key: "username", label: "Username" },
    {
      key: "mode",
      label: "Chế độ kết nối",
      options: ["STARTTLS", "TLS", "NONE"],
    },
    { key: "fromEmail", label: "Địa chỉ người gửi", type: "email" },
    { key: "fromName", label: "Tên người gửi" },
  ],
  HAOBOX: [
    {
      key: "baseUrl",
      label: "API base URL",
      type: "url",
      hint: "Nhập địa chỉ máy chủ API được HaoBox cung cấp, không phải trang website tài liệu. Không thêm /api/v1/developer.",
    },
    { key: "parentId", label: "Thư mục đích / parentId (tùy chọn)" },
    { key: "maxBytes", label: "Giới hạn mỗi file (byte)", type: "number" },
    {
      key: "mimeTypes",
      label: "Loại file cho phép",
      hint: "Các MIME type cách nhau bằng dấu phẩy, ví dụ image/jpeg,image/png,video/mp4,application/pdf",
    },
  ],
  VNPAY: [
    { key: "mode", label: "Môi trường", options: ["sandbox", "production"] },
    { key: "tmnCode", label: "Merchant / TMN code" },
    { key: "endpoint", label: "Endpoint thanh toán", type: "url" },
    {
      key: "returnUrl",
      label: "Return URL",
      type: "url",
      hint: "URL trang /orders trên website Wisdom. Trang chỉ hiển thị trạng thái từ backend.",
    },
    {
      key: "ipnUrl",
      label: "IPN URL",
      type: "url",
      hint: "URL công khai của backend /api/payments/ipn; đăng ký với VNPay.",
    },
  ],
};
export function Settings() {
  const [kind, setKind] = useState<Kind>("SMTP");
  return (
    <>
      <Heading
        title="Cài đặt hệ thống"
        description="Quản lý kết nối dịch vụ. Thay đổi được áp dụng mà không cần khởi động lại."
      />
      <div className="tabs">
        {(
          [
            ["SMTP", "Gửi email", Mail],
            ["HAOBOX", "Lưu trữ file", CloudUpload],
            ["VNPAY", "Thanh toán", CreditCard],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            className={kind === k ? "" : "secondary"}
            aria-pressed={kind === k}
            key={k}
            onClick={() => setKind(k)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
      <SettingsForm key={kind} kind={kind} />
      {kind === "SMTP" && <EmailJobs />}
      <div className="flex items-start gap-3 mt-5 text-sm text-muted">
        <ShieldCheck className="shrink-0" />
        <p>
          Secret được mã hóa trước khi lưu. API không trả lại secret đã lưu.
          Nhật ký chỉ ghi người thao tác và hành động; khóa mã hóa gốc được quản
          lý ở hạ tầng.
        </p>
      </div>
    </>
  );
}
function SettingsForm({ kind }: { kind: Kind }) {
  const query = useQuery({
    queryKey: ["settings", kind],
    queryFn: () => get<Setting>(`/admin/settings/${kind}`),
  });
  const action = useAction();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(false);
  const [secretAction, setSecretAction] = useState("KEEP");
  const [secret, setSecret] = useState("");
  const [recipient, setRecipient] = useState("");
  const [result, setResult] = useState("");
  useEffect(() => {
    if (query.data) {
      setConfig(query.data.config);
      setEnabled(query.data.enabled);
    }
  }, [query.data]);
  return (
    <State query={query}>
      <section className="panel stack max-w-4xl">
        <div className="flex justify-between items-center">
          <h2>
            {kind === "SMTP"
              ? "Cấu hình gửi email"
              : kind === "HAOBOX"
                ? "Kết nối lưu trữ HaoBox"
                : "Cấu hình cổng thanh toán"}
          </h2>
          <span className="badge">
            {query.data?.configured ? "Đã lưu secret" : "Chưa cấu hình secret"}
          </span>
        </div>
        {!query.data?.configured && (
          <p className="notice">
            Nhập cấu hình và secret bên dưới, lưu rồi kiểm tra dịch vụ trước khi
            sử dụng.
          </p>
        )}
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            setResult("");
            action.mutate(
              {
                path: `/admin/settings/${kind}`,
                method: "put",
                data: {
                  config,
                  enabled,
                  secretAction,
                  secret: secretAction === "REPLACE" ? secret : null,
                },
              },
              {
                onSuccess: () => {
                  setSecret("");
                  setSecretAction("KEEP");
                },
              },
            );
          }}
        >
          <label className="flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />{" "}
            Bật dịch vụ
          </label>
          <div className="form-grid">
            {fields[kind].map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                {f.options ? (
                  <select
                    aria-label={f.label}
                    value={config[f.key] || ""}
                    onChange={(e) =>
                      setConfig({ ...config, [f.key]: e.target.value })
                    }
                  >
                    <option value="">Chọn chế độ</option>
                    {f.options.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    value={config[f.key] || ""}
                    onChange={(e) =>
                      setConfig({ ...config, [f.key]: e.target.value })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="form-grid">
            <Field label="Thao tác với secret">
              <select
                value={secretAction}
                onChange={(e) => {
                  setSecretAction(e.target.value);
                  setSecret("");
                }}
              >
                <option value="KEEP">Giữ nguyên secret đã lưu</option>
                <option value="REPLACE">Thay bằng secret mới</option>
                <option value="DELETE">Xóa secret đã lưu</option>
              </select>
            </Field>
            <Field
              label={
                kind === "SMTP"
                  ? "SMTP password"
                  : kind === "HAOBOX"
                    ? "API key"
                    : "Secret ký giao dịch"
              }
              hint={
                query.data?.hasSecret
                  ? "Đã có secret — không hiển thị giá trị."
                  : "Chưa có secret."
              }
            >
              <input
                type="password"
                autoComplete="new-password"
                disabled={secretAction !== "REPLACE"}
                required={secretAction === "REPLACE"}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={
                  secretAction === "REPLACE" ? "Nhập secret mới" : "••••••••"
                }
              />
            </Field>
          </div>
          <button className="self-start" disabled={action.isPending}>
            Lưu cấu hình
          </button>
        </form>
        <hr className="border-line" />
        <h3>Kiểm tra cấu hình đã lưu</h3>
        {kind === "SMTP" && (
          <Field label="Email nhận thử">
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="admin@example.com"
            />
          </Field>
        )}
        <button
          className="secondary self-start"
          disabled={
            action.isPending ||
            !query.data?.enabled ||
            (kind === "SMTP" && !recipient)
          }
          onClick={() => {
            setResult("");
            action.mutate(
              {
                path: `/admin/settings/${kind}/test`,
                data: kind === "SMTP" ? { email: recipient } : undefined,
              },
              { onSuccess: (d) => setResult(d.message) },
            );
          }}
        >
          {kind === "SMTP"
            ? "Gửi email thử"
            : kind === "HAOBOX"
              ? "Kiểm tra quyền đọc danh sách"
              : "Kiểm tra tính hợp lệ cấu hình"}
        </button>
        {result && (
          <p role="status" className="notice">
            {result}
          </p>
        )}
      </section>
    </State>
  );
}
