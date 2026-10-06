import { categoryRows } from "../components/category-picker";
import { Avatar } from "../components/avatar";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Users, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { get, money, currency, errorMessage } from "../lib/api";
import { useAuth } from "../store/auth";
import {
  Heading,
  State,
  Empty,
  Field,
  Badge,
  Pager,
  useAction,
} from "../components/ui";
import type { User, Course, Category, Order, Page } from "../types";
export function Dashboard({ instructor = false }: { instructor?: boolean }) {
  const q = useQuery({
    queryKey: ["dashboard", instructor],
    queryFn: () =>
      get<{
        users: number;
        courses: number;
        enrollments: number;
        revenue: number;
        pending: number;
      }>(`/${instructor ? "instructor" : "admin"}/dashboard`),
  });
  return (
    <>
      <Heading
        title={instructor ? "Tổng quan giảng dạy" : "Tổng quan hệ thống"}
        description="Số liệu từ hoạt động thực tế trên Wisdom."
      />
      <State query={q}>
        {q.data && (
          <>
            <div className="stats">
              {[
                [
                  instructor ? "Khóa học của bạn" : "Người dùng",
                  instructor ? q.data.courses : q.data.users,
                ],
                ["Lượt đăng ký", q.data.enrollments],
                ["Doanh thu", currency(q.data.revenue)],
                ["Chờ duyệt", q.data.pending],
              ].map(([label, value]) => (
                <div className="panel" key={label}>
                  <span className="text-muted text-sm">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <h2 className="mb-5">Tiếp tục công việc</h2>
            <div className="workspace-actions">
              <section className="workspace-action"><div><h3>{instructor ? "Không gian khóa học của bạn" : "Nội dung đang chờ duyệt"}</h3><p>{instructor ? "Cập nhật bài học, chuẩn bị bản nháp và theo dõi học viên." : "Xem nội dung giảng viên gửi lên và phản hồi trước khi xuất bản."}</p><Link className="button" to={instructor ? "/instructor/courses" : "/admin/courses"}>Quản lý khóa học <ArrowUpRight size={16} /></Link></div><BookOpen size={24} /></section>
              <section className="workspace-action"><div><h3>{instructor ? "Tài nguyên giảng dạy" : "Tài khoản và cộng đồng"}</h3><p>{instructor ? "Quản lý video, tài liệu và hình ảnh đã tải lên cho khóa học." : "Quản lý người dùng và xét duyệt yêu cầu trở thành giảng viên."}</p><Link className="button secondary" to={instructor ? "/files" : "/admin/users"}>{instructor ? "Mở thư viện" : "Quản lý tài khoản"} <ArrowUpRight size={16} /></Link></div>{instructor ? <FolderOpen size={24} /> : <Users size={24} />}</section>
            </div>
          </>
        )}
      </State>
    </>
  );
}
export function AdminList({ kind }: { kind: "users" | "courses" | "orders" }) {
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["admin", kind, page],
    queryFn: () =>
      get<Page<User | Course | Order>>(`/admin/${kind}?page=${page}`),
  });
  const title = {
    users: "Quản lý tài khoản",
    courses: "Duyệt khóa học",
    orders: "Quản lý hóa đơn",
  };
  return (
    <>
      <Heading
        title={title[kind]}
        description={kind === "users" ? "Quản lý quyền truy cập và yêu cầu giảng viên." : kind === "courses" ? "Kiểm tra nội dung và phản hồi cho giảng viên trước khi xuất bản." : "Theo dõi giao dịch và xử lý các đơn cần đối soát."}
      />
      <State query={q}>
        {q.data?.content.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    {kind === "users"
                      ? "Người dùng"
                      : kind === "courses"
                        ? "Khóa học"
                        : "Đơn hàng"}
                  </th>
                  <th>Thông tin</th>
                  <th>Thao tác / trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {q.data.content.map((row) =>
                  kind === "users" ? (
                    <UserRow key={row.id} u={row as User} />
                  ) : kind === "courses" ? (
                    <CourseRow key={row.id} c={row as Course} />
                  ) : (
                    <tr key={row.id}>
                      <td>
                        {row.id}
                        <small className="block">
                          {new Date((row as Order).createdAt).toLocaleString(
                            "vi-VN",
                          )}
                        </small>
                      </td>
                      <td>{currency((row as Order).amount)}
                        {(row as Order).transactionNo && <small className="block">Mã giao dịch: {(row as Order).transactionNo}</small>}
                      </td>
                      <td>
                        <Badge value={(row as Order).status} />
                        {(row as Order).status === "PAID_DUPLICATE" && <RefundRecord orderId={row.id} />}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <Pager page={page} total={q.data?.total || 0} onChange={setPage} />
      </State>
    </>
  );
}
function RefundRecord({ orderId }: { orderId: string }) {
  const isAdmin = useAuth(s => s.user?.role === "ADMIN");
  const [reference, setReference] = useState("");
  const action = useAction();
  if (!isAdmin) return null;
  return <details className="mt-3">
    <summary>Ghi nhận hoàn tiền</summary>
    <form className="stack mt-3" onSubmit={e => {
      e.preventDefault();
      action.mutate({ path: `/admin/orders/${orderId}/refund-record`, data: { reference } });
    }}>
      <p className="text-sm text-muted">Chỉ ghi nhận sau khi đã hoàn tiền tại cổng thanh toán. Nút này không chuyển tiền.</p>
      <Field label="Mã đối soát / giao dịch hoàn tiền"><input required maxLength={200} value={reference} onChange={e => setReference(e.target.value)} /></Field>
      {action.isError && <p role="alert">{errorMessage(action.error)}</p>}
      <button disabled={action.isPending || !reference.trim()}>Ghi nhận đã hoàn tiền</button>
    </form>
  </details>;
}

function UserRow({ u }: { u: User }) {
  const [role, setRole] = useState(u.role);
  const [locked, setLocked] = useState(u.locked);
  const action = useAction();
  const admin = useAuth((s) => s.user?.role === "ADMIN");
  return (
    <tr>
      <td>
        <div className="user-identity"><Avatar name={u.name} avatarId={u.avatarId} decorative /><div><strong>{u.name}</strong>
        <small className="block">{u.email}</small></div></div>
        {u.instructorRequest && <Badge value="Xin làm giảng viên" />}
      </td>
      <td>
        {admin ? (
          <select
            aria-label={`Vai trò ${u.name}`}
            value={role}
            onChange={(e) => setRole(e.target.value as User["role"])}
          >
            {["STUDENT", "INSTRUCTOR", "MANAGER", "ADMIN"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        ) : (
          u.role
        )}
      </td>
      <td>
        {admin ? (
          <div className="flex items-center gap-3">
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
              />
              Khóa
            </label>
            <button
              disabled={action.isPending}
              onClick={() =>
                action.mutate({
                  path: `/admin/users/${u.id}`,
                  method: "put",
                  data: { role, locked },
                })
              }
            >
              Lưu
            </button>
          </div>
        ) : (
          <Badge value={u.locked ? "Đã khóa" : "Hoạt động"} />
        )}
      </td>
    </tr>
  );
}
function CourseRow({ c }: { c: Course }) {
  const action = useAction();
  const [reason, setReason] = useState("");
  return (
    <tr>
      <td>
        <Link className="text-brand font-bold" to={`/courses/${c.id}`}>
          {c.title}
        </Link>
        <small className="block">{money(c.price)}</small>
      </td>
      <td>
        <Badge value={c.status} />
        {c.reason && <p>{c.reason}</p>}
      </td>
      <td>
        <div className="stack">
          <input
            aria-label={`Lý do cho ${c.title}`}
            placeholder="Lý do từ chối / ẩn"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {c.status === "PENDING" && (
              <>
                <button
                  disabled={action.isPending}
                  onClick={() =>
                    action.mutate({
                      path: `/admin/courses/${c.id}/decision`,
                      data: { status: "PUBLISHED" },
                    })
                  }
                >
                  Duyệt
                </button>
                <button
                  className="danger"
                  disabled={!reason || action.isPending}
                  onClick={() =>
                    action.mutate({
                      path: `/admin/courses/${c.id}/decision`,
                      data: { status: "REJECTED", reason },
                    })
                  }
                >
                  Từ chối
                </button>
              </>
            )}
            <button
              className="secondary"
              disabled={!reason || action.isPending}
              onClick={() =>
                action.mutate({
                  path: `/admin/courses/${c.id}/decision`,
                  data: { status: "ARCHIVED", reason },
                })
              }
            >
              Ẩn
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
export function Categories() {
  const q = useQuery({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/public/categories"),
  });
  const action = useAction();
  const [edit, setEdit] = useState<Category | null>(null);
  return (
    <>
      <Heading title="Danh mục khóa học" />
      <div className="learning-grid">
        <State query={q}>
          <section className="panel stack">
            {categoryRows(q.data || []).map((c) => (
              <div
                className="flex justify-between gap-4 border-b border-line pb-3"
                key={c.id}
              >
                <strong style={{ paddingLeft: c.depth * 20 }}>{c.depth > 0 ? "↳ " : ""}{c.name}</strong>
                <div className="flex gap-2">
                  <button className="secondary" onClick={() => setEdit(c)}>
                    Sửa
                  </button>
                  <button
                    className="danger"
                    onClick={() =>
                      action.mutate({
                        path: `/admin/categories/${c.id}`,
                        method: "delete",
                      })
                    }
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            {q.data?.length === 0 && <Empty />}
          </section>
        </State>
        <form
          className="panel stack h-fit"
          key={edit?.id || "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            action.mutate(
              {
                path: `/admin/categories${edit ? "/" + edit.id : ""}`,
                method: edit ? "put" : "post",
                data: Object.fromEntries(new FormData(form)),
              },
              {
                onSuccess: () => {
                  setEdit(null);
                  form.reset();
                },
              },
            );
          }}
        >
          <h2>{edit ? "Sửa danh mục" : "Thêm danh mục"}</h2>
          <Field label="Tên danh mục">
            <input
              name="name"
              defaultValue={edit?.name}
              required
              maxLength={120}
            />
          </Field>
          <Field label="Danh mục cha">
            <select name="parentId" defaultValue={edit?.parentId || ""}>
              <option value="">Danh mục gốc</option>
              {categoryRows(q.data || []).filter(c => c.id !== edit?.id && !c.ancestors.includes(edit?.id || "")).map(c => <option key={c.id} value={c.id}>{"— ".repeat(c.depth)}{c.name}</option>)}
            </select>
          </Field>
          <button disabled={action.isPending}>Lưu danh mục</button>
          {edit && (
            <button
              className="secondary"
              type="button"
              onClick={() => setEdit(null)}
            >
              Hủy
            </button>
          )}
        </form>
      </div>
    </>
  );
}
export function Moderation() {
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["moderation", page],
    queryFn: () =>
      get<
        Record<
          string,
          { id: string; body: string; hidden: boolean; kind: string }[]
        >
      >(`/admin/moderation?page=${page}`),
  });
  const action = useAction();
  return (
    <>
      <Heading
        title="Kiểm duyệt nội dung"
        description="Ẩn bình luận hoặc đánh giá vi phạm. Hành động được ghi nhật ký."
      />
      <State query={q}>
        <div className="stack">
          {q.data &&
            [...q.data.comments, ...q.data.reviews].map((x) => (
              <div className="panel flex justify-between gap-4" key={x.id}>
                <p>{x.body}</p>
                <button
                  className="danger shrink-0 h-fit"
                  disabled={x.hidden || action.isPending}
                  onClick={() =>
                    action.mutate({
                      path: `/admin/moderation/${x.kind}/${x.id}`,
                    })
                  }
                >
                  {x.hidden ? "Đã ẩn" : "Ẩn nội dung"}
                </button>
              </div>
            ))}
        </div>
        <div className="pager">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Trước
          </button>
          <span>Trang {page + 1}</span>
          <button
            disabled={Boolean(
              q.data &&
              q.data.comments.length < 25 &&
              q.data.reviews.length < 25,
            )}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </div>
      </State>
    </>
  );
}
export function Audit({ files = false }: { files?: boolean }) {
  const [page, setPage] = useState(0);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["audit", files, page],
    queryFn: () =>
      get<Record<string, string>[]>(
        files ? "/admin/file-issues" : `/admin/audit?page=${page}`,
      ),
  });
  return (
    <>
      <Heading
        title={files ? "Đối chiếu upload" : "Nhật ký hệ thống"}
        description={
          files
            ? "Đối chiếu file đã tải lên trước khi yêu cầu tải lại. Hệ thống kiểm tra tên và kích thước trước khi khôi phục."
            : "Nhật ký không chứa mật khẩu, token hoặc secret dịch vụ."
        }
      />
      <State query={q}>
        {q.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {(files
                    ? [
                        "File",
                        "Provider ID",
                        "Phiên bản cấu hình",
                        "Trạng thái",
                        "Thao tác",
                      ]
                    : ["Thời điểm", "Người thao tác", "Hành động", "Đối tượng"]
                  ).map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.data.map((x) => (
                  <tr key={x.id}>
                    {(files
                      ? [x.name, x.providerId, x.settingId, x.state]
                      : [x.createdAt, x.actorId, x.action, x.targetId]
                    ).map((v, i) => (
                      <td key={i}>{v || "—"}</td>
                    ))}
                    {files && <td><button className="secondary" onClick={() => setSelectedFile(x.id)}>Xử lý file</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        {files && q.data?.filter(x => x.id === selectedFile).map(x => (
          <section className="panel stack mt-4" key={x.id}>
            <h2 className="break-words">{x.name}</h2>
            <FileRecovery file={x} />
          </section>
        ))}
        {!files && (
          <div className="pager">
            <button disabled={!page} onClick={() => setPage(page - 1)}>
              Trước
            </button>
            <span>Trang {page + 1}</span>
            <button
              disabled={(q.data?.length || 0) < 25}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </State>
    </>
  );
}

function FileRecovery({ file }: { file: Record<string, string> }) {
  const [providerId, setProviderId] = useState(file.providerId || "");
  const [page, setPage] = useState(0);
  const action = useAction();
  if (file.state === "DELETE_FAILED") return <div className="stack">
    <button className="secondary" disabled={action.isPending} onClick={() => action.mutate({ path: `/files/${file.id}`, method: "delete" })}>Thử xóa lại</button>
    {action.isError && <p role="alert">{errorMessage(action.error)}</p>}
  </div>;
  if (!["UNKNOWN", "ORPHAN", "PENDING_VALIDATION"].includes(file.state)) return <span>Đang chờ xử lý</span>;
  return <div>
    <h3>Đối soát file</h3>
    <form className="stack mt-3" onSubmit={e => {
      e.preventDefault();
      action.mutate({ path: `/admin/files/${file.id}/reconcile`, data: { providerId, page } });
    }}>
      <Field label="Mã file trên HaoBox"><input required pattern="[A-Za-z0-9_-]{1,100}" maxLength={100}
        readOnly={Boolean(file.providerId)} value={providerId} onChange={e => setProviderId(e.target.value)} /></Field>
      <Field label="Trang bắt đầu tra cứu" hint="Bắt đầu từ 0. Mỗi lần kiểm tra tối đa 20 trang; nếu vượt giới hạn, thử từ trang 20, 40…">
        <input type="number" required min={0} max={10000} value={page} onChange={e => setPage(Number(e.target.value))} />
      </Field>
      {action.isError && <p role="alert">{errorMessage(action.error)}</p>}
      <button disabled={action.isPending}>{action.isPending ? "Đang đối soát…" : "Kiểm tra và khôi phục"}</button>
    </form>
  </div>;
}
