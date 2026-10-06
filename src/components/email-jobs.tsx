import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "../lib/api";
import { Empty, State, useAction } from "./ui";

type EmailJob = {
  id: string;
  status: string;
  attempts: number;
  createdAt: string;
  nextAttemptAt: string;
  expiresAt: string;
};
const labels: Record<string, string> = {
  PENDING: "Chờ gửi", PROCESSING: "Đang gửi", RETRY: "Chờ thử lại",
  FAILED: "Cần kiểm tra", SENT: "Đã gửi", EXPIRED: "Liên kết đã hết hạn",
};

export function EmailJobs() {
  const [page, setPage] = useState(0);
  const action = useAction();
  const query = useQuery({
    queryKey: ["email-jobs", page],
    queryFn: () => get<EmailJob[]>(`/admin/email-jobs?page=${page}`),
    refetchInterval: 10000,
  });
  return <section className="stack mt-8" aria-labelledby="email-jobs-title">
    <h2 id="email-jobs-title">Lịch sử gửi email</h2>
    <p className="text-muted">Email lỗi được thử lại tự động, tối đa 5 lần. Sau khi sửa cấu hình và lưu, bạn có thể gửi lại email còn hạn.</p>
    <State query={query}>
      {query.data?.length ? <div className="table-wrap"><table>
        <thead><tr><th>Thời điểm tạo</th><th>Trạng thái</th><th>Số lần thử</th><th>Thao tác</th></tr></thead>
        <tbody>{query.data.map(job => <tr key={job.id}>
          <td>{new Date(job.createdAt).toLocaleString("vi-VN")}</td>
          <td>{labels[job.status] || job.status}
            {job.status === "RETRY" && <small className="block text-muted">Thử lại: {new Date(job.nextAttemptAt).toLocaleString("vi-VN")}</small>}
          </td>
          <td>{job.attempts}</td>
          <td>{["FAILED", "RETRY"].includes(job.status) && new Date(job.expiresAt).getTime() > Date.now()
            ? <button className="secondary" disabled={action.isPending}
                onClick={() => action.mutate({ path: `/admin/email-jobs/${job.id}/retry` })}>Gửi lại email</button>
            : job.status === "EXPIRED" ? "Người dùng cần yêu cầu liên kết mới" : "—"}</td>
        </tr>)}</tbody>
      </table></div> : <Empty text="Chưa có email trong hàng đợi" />}
      <div className="pager">
        <button className="secondary" disabled={!page || query.isFetching} onClick={() => setPage(page - 1)}>Trước</button>
        <span>Trang {page + 1}</span>
        <button className="secondary" disabled={query.isFetching || (query.data?.length || 0) < 25} onClick={() => setPage(page + 1)}>Sau</button>
      </div>
    </State>
  </section>;
}
