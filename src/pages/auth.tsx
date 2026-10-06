import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../store/auth";
import { Field } from "../components/ui";
const schema = z.object({
  email: z.email("Email chưa hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
  name: z.string().optional(),
});
export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const nav = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [done, setDone] = useState(false);
  return (
    <div className="auth-layout">
    <div className="auth-story"><img src="/icon.png" alt="" width={200} height={200} /><h2>Một khởi đầu nhỏ.<br />Một thế giới kiến thức.</h2><p>Khám phá khóa học, lưu những điều bạn quan tâm và tiếp tục học theo nhịp của riêng mình.</p></div>
    <section className="panel auth-card stack">
      <h1>
        {mode === "login" ? "Chào mừng trở lại" : "Bắt đầu hành trình học tập"}
      </h1>
      <p className="text-muted">Một tài khoản, nhiều cơ hội khám phá.</p>
      {done ? (
        <div role="status" className="notice">
          Đã tạo tài khoản. Email xác minh sẽ được gửi đến bạn; hãy kiểm tra hộp thư trước khi đăng nhập.
        </div>
      ) : (
        <form
          className="stack"
          onSubmit={handleSubmit(async (values) => {
            try {
              if (
                mode === "register" &&
                (!values.name || values.password.length < 10)
              ) {
                toast.error("Nhập họ tên và mật khẩu ít nhất 10 ký tự");
                return;
              }
              const { data } = await api.post(`/auth/${mode}`, values);
              if (mode === "login") {
                setSession(data);
                nav("/");
              } else setDone(true);
            } catch (e) {
              toast.error(errorMessage(e));
            }
          })}
        >
          {mode === "register" && (
            <Field label="Họ và tên">
              <input autoComplete="name" required {...register("name")} />
            </Field>
          )}
          <Field label="Email">
            <input autoComplete="email" type="email" {...register("email")} />
            {errors.email && <small role="alert">{errors.email.message}</small>}
          </Field>
          <Field
            label="Mật khẩu"
            hint={mode === "register" ? "Ít nhất 10 ký tự." : " "}
          >
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              {...register("password")}
            />
          </Field>
          <button disabled={isSubmitting}>
            {isSubmitting
              ? "Đang xử lý…"
              : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
          </button>
        </form>
      )}
      <div className="flex flex-wrap justify-between gap-3 text-sm text-brand">
        <Link to={mode === "login" ? "/register" : "/login"}>
          {mode === "login"
            ? "Tạo tài khoản mới"
            : "Đã có tài khoản? Đăng nhập"}
        </Link>
        <Link to="/forgot">Quên mật khẩu</Link>
        <Link to="/resend">Gửi lại email xác minh</Link>
      </div>
    </section>
    </div>
  );
}
export function TokenPage({
  mode,
}: {
  mode: "forgot" | "reset" | "verify" | "resend";
}) {
  const [params] = useSearchParams();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const titles = {
    forgot: "Quên mật khẩu",
    reset: "Đặt lại mật khẩu",
    verify: "Xác minh email",
    resend: "Gửi lại email xác minh",
  };
  return (
    <section className="panel auth-card stack">
      <h1>{titles[mode]}</h1>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const values = Object.fromEntries(new FormData(e.currentTarget));
          try {
            const r = await api.post(`/auth/${mode}`, {
              ...values,
              token: params.get("token"),
            });
            setMessage(r.data.message);
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {(mode === "forgot" || mode === "resend") && (
          <Field label="Email">
            <input name="email" type="email" required />
          </Field>
        )}
        {mode === "reset" && (
          <Field label="Mật khẩu mới">
            <input
              name="password"
              type="password"
              minLength={10}
              maxLength={72}
              required
            />
          </Field>
        )}
        {mode === "verify" && (
          <p>Xác nhận liên kết trong email để kích hoạt tài khoản.</p>
        )}
        <button disabled={busy || Boolean(message)}>
          {busy ? "Đang xử lý…" : "Xác nhận"}
        </button>
      </form>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <Link className="text-brand" to="/login">
        Trở về đăng nhập
      </Link>
    </section>
  );
}
