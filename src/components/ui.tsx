import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactNode,
  type ReactElement,
} from "react";
import {
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle, BookOpen, AlertCircle } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { WisdomLoader } from "./wisdom-loader";
export function State({
  query,
  children,
}: {
  query: UseQueryResult<unknown>;
  children: ReactNode;
}) {
  if (query.isPending)
    return (
      <WisdomLoader />
    );
  if (query.isError)
    return (
      <div className="state" role="alert">
        <AlertCircle />
        <p>{errorMessage(query.error)}</p>
        <button onClick={() => query.refetch()}>Thử lại</button>
      </div>
    );
  return <>{children}</>;
}
export function Empty({
  text = "Chưa có dữ liệu",
  children,
}: {
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="state">
      <BookOpen size={32} />
      <h3>{text}</h3>
      {children}
    </div>
  );
}
export function Heading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, (child) =>
        isValidElement(child) &&
        typeof child.type === "string" &&
        ["input", "select", "textarea"].includes(child.type)
          ? cloneElement(
              child as ReactElement<{
                id: string;
                "aria-describedby"?: string;
              }>,
              { id, "aria-describedby": hint ? `${id}-hint` : undefined },
            )
          : child,
      )}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function useAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      path,
      data,
      method = "post",
    }: {
      path: string;
      data?: unknown;
      method?: "post" | "put" | "delete";
    }) => (await api.request({ url: path, method, data })).data,
    onSuccess: (data) => {
      toast.success(data?.message || "Đã lưu thay đổi");
      void client.invalidateQueries();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
export function Pager({
  page,
  total,
  size = 25,
  onChange,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="pager">
      <button
        className="secondary"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </button>
      <span>
        Trang {page + 1} · {total} kết quả
      </span>
      <button
        className="secondary"
        disabled={(page + 1) * size >= total}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </button>
    </div>
  );
}
export const statusLabel = (status: string) =>
  ({
    DRAFT: "Bản nháp",
    PENDING: "Chờ duyệt",
    PUBLISHED: "Đã xuất bản",
    REJECTED: "Từ chối",
    ARCHIVED: "Đã ẩn",
    PAID: "Đã thanh toán",
    PAID_DUPLICATE: "Thanh toán trùng · chờ đối soát",
    REFUNDED: "Đã ghi nhận hoàn tiền",
    EXPIRED: "Đã hết hạn",
    FAILED: "Thất bại",
    READY: "Sẵn sàng",
    UPLOADING: "Đang tải lên",
    PENDING_VALIDATION: "Đang kiểm tra",
    UNKNOWN: "Chờ kiểm tra",
    ORPHAN: "Cần hỗ trợ",
    TRASHED: "Đã xóa",
    DELETE_FAILED: "Xóa chưa thành công",
    DELETING: "Đang xóa",
  })[status] || status;
export function Badge({ value }: { value: string }) {
  const tone = ["PAID", "READY", "PUBLISHED", "REFUNDED"].includes(value) ? "success" : ["FAILED", "REJECTED", "DELETE_FAILED"].includes(value) ? "danger" : ["PENDING", "PAID_DUPLICATE", "UNKNOWN", "ORPHAN"].includes(value) ? "warning" : ["DRAFT", "ARCHIVED", "EXPIRED", "TRASHED"].includes(value) ? "muted" : "brand";
  return <span className="badge" data-tone={tone}>{statusLabel(value)}</span>;
}
