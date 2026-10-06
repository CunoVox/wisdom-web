import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuth } from "../store/auth";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "X-Wisdom-Client": "web" },
});
api.interceptors.request.use((c) => {
  const token = useAuth.getState().token;
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
let refreshing: Promise<void> | null = null;
export async function refresh() {
  refreshing ??= api
    .post("/auth/refresh")
    .then((r) => {
      useAuth.getState().setSession(r.data);
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const c = error.config as InternalAxiosRequestConfig & {
      retried?: boolean;
    };
    if (
      error.response?.status === 401 &&
      c &&
      !c.retried &&
      !c.url?.startsWith("/auth/")
    ) {
      c.retried = true;
      try {
        await refresh();
        return api(c);
      } catch {
        useAuth.getState().clear();
      }
    }
    return Promise.reject(error);
  },
);
export async function get<T>(path: string): Promise<T> {
  return (await api.get<T>(path)).data;
}
export const errorMessage = (e: unknown) =>
  axios.isAxiosError(e)
    ? e.response?.data?.message ||
      "Không thể kết nối máy chủ. Vui lòng thử lại."
    : "Không thể hoàn thành thao tác";
export const mediaUrl = (id: string) =>
  `${api.defaults.baseURL}/files/${encodeURIComponent(id)}/content`;
export const currency = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(n);
export const money = (n: number) => n === 0 ? "Miễn phí" : currency(n);
