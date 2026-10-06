import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./store/auth";
import { refresh } from "./lib/api";
import { Layout } from "./components/layout";
import { WisdomLoader } from "./components/wisdom-loader";
const AuthPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.AuthPage })),
);
const TokenPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.TokenPage })),
);
const Catalog = lazy(() =>
  import("./pages/catalog").then((m) => ({ default: m.Catalog })),
);
const CourseDetail = lazy(() =>
  import("./pages/catalog").then((m) => ({ default: m.CourseDetail })),
);
const CourseCollection = lazy(() =>
  import("./pages/catalog").then((m) => ({ default: m.CourseCollection })),
);
const InstructorProfile = lazy(() =>
  import("./pages/catalog").then((m) => ({ default: m.InstructorProfile })),
);
const Learning = lazy(() =>
  import("./pages/learning").then((m) => ({ default: m.Learning })),
);
const Profile = lazy(() =>
  import("./pages/profile").then((m) => ({ default: m.Profile })),
);
const Files = lazy(() =>
  import("./pages/profile").then((m) => ({ default: m.Files })),
);
const Orders = lazy(() =>
  import("./pages/profile").then((m) => ({ default: m.Orders })),
);
const Settings = lazy(() =>
  import("./pages/settings").then((m) => ({ default: m.Settings })),
);
const AuthorCourses = lazy(() =>
  import("./pages/author").then((m) => ({ default: m.AuthorCourses })),
);
const CourseEditor = lazy(() =>
  import("./pages/author").then((m) => ({ default: m.CourseEditor })),
);
const AdminList = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.AdminList })),
);
const Dashboard = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.Dashboard })),
);
const Categories = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.Categories })),
);
const Moderation = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.Moderation })),
);
const Audit = lazy(() =>
  import("./pages/admin").then((m) => ({ default: m.Audit })),
);
function Guard({ roles }: { roles?: string[] }) {
  const { user, ready } = useAuth();
  if (!ready) return <WisdomLoader fullscreen label="Đang khôi phục phiên…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return (
      <div className="state" role="alert">
        Bạn không có quyền truy cập khu vực này.
      </div>
    );
  return <Outlet />;
}
export default function App() {
  const ready = useAuth((state) => state.ready);
  useEffect(() => {
    void refresh().catch(() => useAuth.getState().clear());
  }, []);
  if (!ready)
    return (
      <WisdomLoader fullscreen label="Đang mở không gian học tập…" />
    );
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <WisdomLoader fullscreen label="Đang tải trang…" />
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Catalog />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />
            {(["forgot", "reset", "verify", "resend"] as const).map((mode) => (
              <Route
                key={mode}
                path={mode}
                element={<TokenPage mode={mode} />}
              />
            ))}
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="courses/:id/learn/:lessonId" element={<Learning />} />
            <Route path="instructors/:id" element={<InstructorProfile />} />
            <Route element={<Guard />}>
              <Route path="learning" element={<CourseCollection />} />
              <Route
                path="bookmarks"
                element={<CourseCollection bookmarks />}
              />
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="files" element={<Files />} />
            </Route>
            <Route
              element={<Guard roles={["INSTRUCTOR", "MANAGER", "ADMIN"]} />}
            >
              <Route path="instructor" element={<Dashboard instructor />} />
              <Route path="instructor/courses" element={<AuthorCourses />} />
              <Route path="instructor/courses/:id" element={<CourseEditor />} />
            </Route>
            <Route element={<Guard roles={["MANAGER", "ADMIN"]} />}>
              <Route path="admin" element={<Dashboard />} />
              {(["users", "courses", "orders"] as const).map((kind) => (
                <Route
                  key={kind}
                  path={`admin/${kind}`}
                  element={<AdminList kind={kind} />}
                />
              ))}
              <Route path="admin/categories" element={<Categories />} />
              <Route path="admin/moderation" element={<Moderation />} />
            </Route>
            <Route element={<Guard roles={["ADMIN"]} />}>
              <Route path="admin/settings" element={<Settings />} />
              <Route path="admin/audit" element={<Audit />} />
              <Route path="admin/file-issues" element={<Audit files />} />
            </Route>
            <Route
              path="*"
              element={
                <div className="state">
                  <h1>Không tìm thấy trang</h1>
                  <a className="button" href="/">
                    Trở về khám phá
                  </a>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
