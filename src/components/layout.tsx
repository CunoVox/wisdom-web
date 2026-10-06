import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Compass,
  Library,
  Bookmark,
  UserRound,
  LayoutDashboard,
  Settings,
  Users,
  BookOpen,
  Receipt,
  Folder,
  LogOut,
  ShieldCheck,
  Files,
  Menu,
  X,
  Search,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, get, errorMessage } from "../lib/api";
import { toast } from "sonner";
import { CategoryPicker } from "./category-picker";
import type { Category } from "../types";
import { useAuth } from "../store/auth";
import { Avatar } from "./avatar";
import { MorphSymbol } from "./morph-symbol";
import { motion, useReducedMotion } from "motion/react";
export function Layout() {
  const reduceMotion = useReducedMotion();
  const { user, clear } = useAuth();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRoot = useRef<HTMLDivElement>(null);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    const dismiss = (e: PointerEvent) => { if (!accountRoot.current?.contains(e.target as Node)) setAccountOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const nav = useNavigate();
  const qc = useQueryClient();
  const staff = user && ["ADMIN", "MANAGER"].includes(user.role);
  const instructor = user?.role === "INSTRUCTOR";
  const { pathname } = useLocation();
  const adminWorkspace = /^\/admin(\/|$)/.test(pathname);
  const instructorWorkspace =
    /^\/instructor(\/|$)/.test(pathname) ||
    (pathname === "/files" && instructor);
  const canUseInstructorWorkspace =
    user && ["INSTRUCTOR", "MANAGER", "ADMIN"].includes(user.role);
  const sidebar = Boolean(
    (instructorWorkspace && canUseInstructorWorkspace) ||
      (adminWorkspace && staff),
  );
  const learning = /\/learn\//.test(pathname);
  useEffect(() => { setOpen(false); setAccountOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLButtonElement>(".close")?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
      if (e.key === "Tab") {
        const items = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a, button') || []).filter(x => x.getClientRects().length);
        if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)?.focus(); }
        else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0]?.focus(); }
      }
    };
    document.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", escape); };
  }, [open]);
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/public/categories"), enabled: !sidebar });
  const item = (to: string, label: string, Icon: typeof Compass) => (
    <NavLink to={to} end onClick={() => setOpen(false)}>
      <Icon size={19} />
      {label}
    </NavLink>
  );
  return (
    <div className={`shell ${sidebar ? "admin-shell" : "public-shell"} ${learning ? "study-shell" : ""}`}>
      <a className="skip-link" href="#main-content">Đến nội dung chính</a>
      {sidebar && open && <button className="sidebar-scrim" aria-label="Đóng điều hướng" onClick={() => { setOpen(false); menuButton.current?.focus(); }} />}
      {sidebar && <aside ref={sidebarRef} id="workspace-navigation" className={open ? "open" : ""} aria-label="Điều hướng quản lý">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="Wisdom — Trang chủ" width={1944} height={809} />
        </Link>
        <button
          className="mobile close secondary"
          aria-label="Đóng menu"
          onClick={() => { setOpen(false); menuButton.current?.focus(); }}
        >
          <X />
        </button>
        <nav>
          {instructorWorkspace && (
            <>
              <div className="nav-label">GIẢNG VIÊN</div>
              {item("/instructor", "Tổng quan", LayoutDashboard)}
              {item("/instructor/courses", "Khóa học giảng dạy", BookOpen)}
              {item("/files", "Thư viện tài nguyên", Files)}
            </>
          )}
          {adminWorkspace && staff && (
            <>
              <div className="nav-label">
                {user?.role === "ADMIN" ? "QUẢN TRỊ" : "QUẢN LÝ"}
              </div>
              {item("/admin", "Tổng quan hệ thống", LayoutDashboard)}
              {item("/admin/users", "Tài khoản", Users)}
              {item("/admin/courses", "Duyệt khóa học", ShieldCheck)}
              {item("/admin/categories", "Danh mục", Folder)}
              {item("/admin/orders", "Hóa đơn", Receipt)}
              {item("/admin/moderation", "Kiểm duyệt nội dung", ShieldCheck)}
              {user?.role === "ADMIN" && (
                <>
                  {item("/admin/settings", "Cài đặt hệ thống", Settings)}
                  {item("/admin/audit", "Nhật ký", Receipt)}
                  {item("/admin/file-issues", "Đối chiếu upload", Files)}
                </>
              )}
            </>
          )}
        </nav>
        <div className="sidebar-bottom"><Link to="/"><ArrowLeft size={16} /> Trở về trang học tập</Link></div>
      </aside>}
      <div className="workspace">
        <header>
          {sidebar ? <><button
            ref={menuButton}
            className="mobile secondary"
            aria-label="Mở menu"
            aria-controls="workspace-navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <span className="workspace-context">Wisdom <span>/</span> {adminWorkspace ? "Quản trị hệ thống" : "Không gian giảng dạy"}</span></> : <>
            <Link to="/" className="public-brand"><img src="/logo.png" alt="Wisdom — Trang chủ" /></Link>
            <div className="public-search">
              <CategoryPicker categories={categories.data || []} value="" onChange={id => nav(`/?category=${encodeURIComponent(id)}#courses`)} />
              <form role="search" onSubmit={e => { e.preventDefault(); const value = new FormData(e.currentTarget).get("q") || ""; nav(`/?q=${encodeURIComponent(String(value))}#courses`); }}>
                <input name="q" type="search" aria-label="Tìm khóa học" placeholder="Bạn muốn học gì hôm nay?" />
                <button type="submit" aria-label="Tìm kiếm"><Search size={20} /></button>
              </form>
            </div>
          </>}
          <div className="header-account flex items-center gap-3">
            {user ? (
              <div className="account-menu" ref={accountRoot}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAccountOpen(false); }}
                onKeyDown={e => { if (e.key === "Escape") { setAccountOpen(false); accountTrigger.current?.focus(); } }}>
                <button ref={accountTrigger} className="account-link" aria-label="Menu tài khoản"
                  aria-expanded={accountOpen} aria-controls="account-navigation"
                  onClick={() => setAccountOpen(value => !value)}>
                  <Avatar name={user.name} avatarId={user.avatarId} className="account-avatar" decorative />
                  <span className="account-name">{user.name}</span><MorphSymbol active={accountOpen} size={16} />
                </button>
                {accountOpen && <motion.div initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }} className="account-dropdown" id="account-navigation">
                  <div className="account-menu-heading"><strong>{user.name}</strong><small>{user.email}</small></div>
                  <nav aria-label={sidebar ? "Tài khoản" : "Điều hướng học tập"} onClick={() => setAccountOpen(false)}>
                    {sidebar ? (
                      <NavLink to="/profile"><UserRound size={18} />Hồ sơ</NavLink>
                    ) : (
                      <>
                        <NavLink to="/learning"><Library size={18} />Khóa học của tôi</NavLink>
                        <NavLink to="/bookmarks"><Bookmark size={18} />Đã lưu</NavLink>
                        <NavLink to="/orders"><Receipt size={18} />Thanh toán</NavLink>
                        <NavLink to="/profile"><UserRound size={18} />Hồ sơ</NavLink>
                        {instructor && <div className="account-teaching-section"><NavLink className="account-teaching" to="/instructor"><BookOpen size={18} /><span>Giảng dạy</span><ArrowUpRight size={16} aria-hidden="true" /></NavLink></div>}
                        {staff && <NavLink className="account-teaching" to="/admin"><LayoutDashboard size={18} /><span>Quản lý</span><ArrowUpRight size={16} aria-hidden="true" /></NavLink>}
                      </>
                    )}
                  </nav>
                  <button className="account-logout" disabled={loggingOut} onClick={async () => {
                    setLoggingOut(true);
                    try { await api.post("/auth/logout"); setAccountOpen(false); clear(); qc.clear(); nav("/"); }
                    catch (e) { toast.error(errorMessage(e)); }
                    finally { setLoggingOut(false); }
                  }}><LogOut size={18} />{loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button>
                </motion.div>}
              </div>
            ) : (
              <>
                <Link className="button secondary" to="/login">Đăng nhập</Link>
                <Link className="button" to="/register">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className={!sidebar ? "public-footer" : ""}>
          {!sidebar && <div className="footer-main"><div><Link to="/" className="footer-logo"><img src="/logo.png" alt="Wisdom" width={180} /></Link><h2>Kiến thức hôm nay.<br />Cơ hội ngày mai.</h2></div><div className="footer-links"><strong>Khám phá Wisdom</strong><Link to="/">Tìm khóa học</Link><Link to="/learning">Khóa học của tôi</Link><Link to={user ? "/profile" : "/register"}>Trở thành giảng viên <ArrowUpRight size={14} /></Link></div></div>}
          <div className="footer-bottom"><p>Wisdom · Học theo cách của bạn</p>{!sidebar && <span>Tiếng Việt</span>}</div>
        </footer>
      </div>
    </div>
  );
}
