import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { get, currency } from "../lib/api";
import { useAuth } from "../store/auth";
import { FileUpload } from "../components/file-upload";
import {
  Field,
  Heading,
  State,
  Empty,
  Badge,
  useAction,
} from "../components/ui";
import type { StoredFile, User, Order } from "../types";
import { ArrayPager } from "../components/array-pager";
export function Profile() {
  const user = useAuth((s) => s.user);
  const action = useAction();
  const [avatarId, setAvatarId] = useState(user?.avatarId || "");
  return (
    <>
      <Heading
        title="Hồ sơ cá nhân"
        description="Giới thiệu bản thân và quản lý bảo mật tài khoản."
      />
      <div className="form-grid profile-grid">
        <section className="panel stack">
          <h2>Thông tin của bạn</h2>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              action.mutate(
                {
                  path: "/me/profile",
                  method: "put",
                  data: { ...data, avatarId: avatarId || null },
                },
                { onSuccess: (u: User) => useAuth.setState({ user: u }) },
              );
            }}
          >
            <FileUpload label="Tải ảnh đại diện" purpose="AVATAR" value={avatarId} onUploaded={(f) => setAvatarId(f.id)} />
            <Field label="Họ và tên">
              <input
                name="name"
                defaultValue={user?.name}
                required
                maxLength={120}
              />
            </Field>
            <Field label="Giới thiệu">
              <textarea name="bio" defaultValue={user?.bio} maxLength={5000} />
            </Field>
            <button disabled={action.isPending}>Lưu hồ sơ</button>
          </form>
        </section>
        <div className="stack">
          <section className="panel stack">
            <h2>Đổi mật khẩu</h2>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                action.mutate(
                  {
                    path: "/auth/password",
                    data: Object.fromEntries(new FormData(e.currentTarget)),
                  },
                  { onSuccess: () => useAuth.getState().clear() },
                );
              }}
            >
              <Field label="Mật khẩu hiện tại">
                <input
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Field label="Mật khẩu mới">
                <input
                  name="password"
                  type="password"
                  minLength={10}
                  maxLength={72}
                  required
                  autoComplete="new-password"
                />
              </Field>
              <button disabled={action.isPending}>Đổi mật khẩu</button>
            </form>
          </section>
          {user?.role === "STUDENT" && (
            <section className="panel stack">
              <h2>Chia sẻ kiến thức</h2>
              <p className="text-muted">
                Đăng ký trở thành giảng viên. Quản trị viên sẽ xét duyệt yêu cầu
                và cấp quyền.
              </p>
              <button
                disabled={action.isPending || user.instructorRequest}
                onClick={() =>
                  action.mutate(
                    { path: "/me/instructor-request" },
                    {
                      onSuccess: () =>
                        useAuth.setState({
                          user: { ...user, instructorRequest: true },
                        }),
                    },
                  )
                }
              >
                {user.instructorRequest
                  ? "Yêu cầu đang chờ xét duyệt"
                  : "Đăng ký làm giảng viên"}
              </button>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
export function Files() {
  const q = useQuery({
    queryKey: ["files"],
    queryFn: () => get<StoredFile[]>("/files"),
  });
  const action = useAction();
  return (
    <>
      <Heading
        title="Thư viện tài nguyên"
        description="Quản lý các file đã tải lên. File đang được sử dụng cần được gỡ khỏi nội dung trước khi xóa."
      />
      <State query={q}>
        {q.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên file</th>
                  <th>Mục đích</th>
                  <th>Trạng thái</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {q.data.map((f) => (
                  <tr key={f.id}>
                    <td>
                      {f.name}
                      <small className="block">
                        {(f.size / 1048576).toFixed(2)} MB
                      </small>
                    </td>
                    <td>{({ AVATAR: "Ảnh đại diện", COVER: "Ảnh bìa", LESSON: "Nội dung bài học", EDITOR_IMAGE: "Ảnh nội dung" } as Record<string, string>)[f.purpose] || "File"}</td>
                    <td>
                      <Badge value={f.state} />
                    </td>
                    <td>
                      <button
                        className="danger"
                        disabled={action.isPending}
                        onClick={() =>
                          action.mutate({
                            path: `/files/${f.id}`,
                            method: "delete",
                          })
                        }
                      >
                        Đưa vào thùng rác
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Chưa có tài nguyên" />
        )}
      </State>
    </>
  );
}
export function Orders() {
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["orders", page],
    queryFn: () => get<Order[]>(`/me/orders?page=${page}`),
    refetchInterval: 10000,
  });
  return (
    <>
      <Heading
        title="Lịch sử thanh toán"
        description="Giao dịch mới có thể cần vài phút để cập nhật. Bạn có thể xem kết quả thanh toán tại đây."
      />
      <State query={q}>
        {q.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Thời gian</th>
                  <th>Số tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {q.data.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                    <td>{currency(o.amount)}</td>
                    <td>
                      <Badge value={o.status === "PENDING" ? "Chờ thanh toán" : o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Chưa có giao dịch" />
        )}
        <ArrayPager
          page={page}
          count={q.data?.length || 0}
          onChange={setPage}
        />
      </State>
    </>
  );
}
