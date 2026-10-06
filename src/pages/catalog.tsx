import { CategoryPicker } from "../components/category-picker";
import { Avatar } from "../components/avatar";
import { motion, useReducedMotion } from "motion/react";
import { RichContent } from "../components/rich-content";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ArrowUpRight,
  Bookmark,
  Star,
  Play,
  Lock,
  ArrowRight,
  Users,
  ChevronDown,
  Search,
  Check,
  Clock,
} from "lucide-react";
import { get, mediaUrl, money } from "../lib/api";
import { useAuth } from "../store/auth";
import {
  State,
  Empty,
  Heading,
  Pager,
  useAction,
  Field,
} from "../components/ui";
import type { Course, Category, Page } from "../types";
import { ArrayPager } from "../components/array-pager";

function courseIntroduction(course: Course) {
  if (course.introduction?.trim()) return course.introduction.trim();
  const container = document.createElement("div");
  container.innerHTML = course.description || "";
  const text = (container.textContent || "").replace(/\s+/g, " ").trim();
  return text.length <= 280 ? text : `${text.slice(0, 277).trim()}...`;
}

export function CourseCard({
  course: c,
  bookmark = false,
}: {
  course: Course;
  bookmark?: boolean;
}) {
  const action = useAction();
  return (
    <article className="course-card">
      <Link to={`/courses/${c.id}`}>
        <div className="course-art">
          {c.coverId ? (
            <img src={mediaUrl(c.coverId)} alt="" loading="lazy" />
          ) : (
            <div className="course-cover-fallback"><span>{c.category || "Wisdom"}</span><strong>{c.title}</strong><BookOpen size={28} strokeWidth={1.5} /></div>
          )}
        </div>
        <div className="course-body">
          <span className="course-category">{c.category || "Khóa học"}</span>
          <h3>{c.title}</h3>
          <p>{c.instructor}</p>
          {c.totalLessons === undefined && <small className="course-meta"><Users size={14} /> {c.enrollments || 0} học viên</small>}
          {c.totalLessons !== undefined && (
            <>
              <progress
                className="w-full accent-brand mt-3"
                value={c.completed || 0}
                max={c.totalLessons || 1}
              />
              <small>
                {c.completed}/{c.totalLessons} bài hoàn thành
              </small>
            </>
          )}
        </div>
      </Link>
      <div className="course-foot">
        <strong className="text-brand">{money(c.price)}</strong>
        {bookmark ? (
          <button
            className="icon-button"
            aria-label={`Bỏ lưu ${c.title}`}
            onClick={() =>
              action.mutate({
                path: `/courses/${c.id}/bookmark`,
                method: "delete",
              })
            }
          >
            <Bookmark size={18} fill="currentColor" />
          </button>
        ) : (
          <Link
            className="flex items-center gap-2"
            to={
              c.lastLessonId
                ? `/courses/${c.id}/learn/${c.lastLessonId}`
                : `/courses/${c.id}`
            }
          >
            {c.totalLessons !== undefined ? "Tiếp tục học" : "Xem khóa học"} <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </article>
  );
}
export function Catalog() {
  const reduceMotion = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const setQ = (value: string) => setParams(previous => { previous.set("q", value); previous.delete("page"); return previous; }, { replace: true });
  const setCategory = (value: string) => setParams(previous => { previous.set("category", value); previous.delete("page"); return previous; }, { replace: true });
  const [sort, setSort] = useState("newest");
  const page = Math.max(0, Number(params.get("page")) || 0);
  const setPage = (value: number) => setParams(previous => { previous.set("page", String(value)); return previous; }, { replace: true });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/public/categories"),
  });
  const courses = useQuery({
    queryKey: ["catalog", q, category, sort, page],
    queryFn: () =>
      get<Page<Course>>(
        `/public/courses?${new URLSearchParams({ q, category, sort, page: String(page), size: "12" })}`,
      ),
  });
  const roots = (cats.data || []).filter(c => !c.parentId);
  const filtered = Boolean(q || category);
  return (
    <>
      {!filtered && <div className="discovery-intro">
        <section className="discovery-hero" aria-labelledby="home-title">
          <div className="discovery-hero-inner">
            <div className="discovery-copy">
              <h1 id="home-title">Học điều mới.<br /><span>Mở lối</span><br />tương lai.</h1>
              <p>Khám phá điều bạn muốn học, thực hành từng bước và tiến xa hơn mỗi ngày cùng Wisdom.</p>
              <a className="button hero-cta" href="#courses">Khám phá khóa học <ArrowUpRight size={20} /></a>
              <div className="hero-note"><BookOpen size={18} />Kiến thức thực tế. Nhịp học của riêng bạn.</div>
            </div>
            <motion.div className="discovery-art" initial={false} animate={reduceMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
              <img src="/visuals/learning-about.webp" alt="Học viên trao đổi và tự học với tài liệu" width={600} height={581} fetchPriority="high" />
            </motion.div>
          </div>
        </section>
        <section className="discovery-benefits" aria-label="Lợi ích học tập">
          <div className="discovery-benefits-inner">
            {([
              [BookOpen, "Khóa học trực tuyến", "Khám phá nhiều chủ đề mới"],
              [Check, "Giảng viên kinh nghiệm", "Tìm khóa học phù hợp với bạn"],
              [Clock, "Truy cập trọn đời", "Học theo lịch trình của bạn"],
            ] as const).map(([Icon, title, description]) => <div className="discovery-benefit" key={title}>
              <span className="discovery-benefit-icon"><Icon size={27} strokeWidth={1.6} aria-hidden="true" /></span>
              <div><h2>{String(title)}</h2><p>{String(description)}</p></div>
            </div>)}
          </div>
        </section>
      </div>}
      <section id="courses" className="catalog-section" aria-labelledby="catalog-heading">
      <div className="catalog-heading">
        <div>{filtered ? <h1 id="catalog-heading">{q ? `Kết quả cho “${q}”` : cats.data?.find(c => c.id === category)?.name || "Khóa học theo danh mục"}</h1> : <h2 id="catalog-heading">Khám phá điều<br className="desktop-break" /> bạn <span>muốn học.</span></h2>}<p>Chọn một khởi đầu. Tạo nên bước tiến của riêng bạn.</p></div>
        {courses.data && <span className="result-count">{courses.data.total} khóa học</span>}
      </div>
      {roots.length > 0 && <div className="topic-tabs" aria-label="Chủ đề khóa học">
        <button className={!category ? "selected" : ""} aria-pressed={!category} onClick={() => setCategory("")}>Tất cả</button>
        {roots.map(c => <button key={c.id} className={category === c.id ? "selected" : ""} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}</button>)}
      </div>}
      <div className="toolbar catalog-toolbar">
        <div className="filter-search"><Search size={18} />
        <input
          type="search"
          aria-label="Tìm kiếm khóa học"
          placeholder="Tìm tên khóa học…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
        />
        </div>
        <CategoryPicker categories={cats.data || []} value={category} onChange={setCategory} />
        <select
          aria-label="Sắp xếp"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
        >
          <option value="newest">Mới nhất</option>
          <option value="priceAsc">Giá tăng dần</option>
          <option value="priceDesc">Giá giảm dần</option>
        </select>
      </div>
      <State query={courses}>
        {courses.data?.content.length ? (
          <div className="course-grid">
            {courses.data.content.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <Empty text="Chưa tìm thấy khóa học phù hợp"><p>Thử từ khóa khác hoặc khám phá tất cả chủ đề.</p>{filtered && <button className="secondary" onClick={() => setParams({})}>Xóa bộ lọc</button>}</Empty>
        )}
        {(courses.data?.total || 0) > 12 && <Pager
          page={page}
          size={12}
          total={courses.data?.total || 0}
          onChange={setPage}
        />}
      </State>
      </section>
      {!filtered && <>
        {roots.length > 0 && <section className="topic-directory"><h2>Bắt đầu từ lĩnh vực bạn yêu thích</h2><div>{roots.map(c => <Link key={c.id} to={`/?category=${encodeURIComponent(c.id)}#courses`}>{c.name}<ArrowUpRight size={18} /></Link>)}</div></section>}
        <section className="teaching-banner"><div><h2>Biến kinh nghiệm của bạn thành bài học.</h2><p>Chia sẻ kiến thức, xây dựng khóa học và đồng hành cùng học viên trên Wisdom.</p></div><Link className="button secondary" to="/profile">Trở thành giảng viên <ArrowRight size={17} /></Link></section>
      </>}
    </>
  );
}
export function CourseDetail() {
  const { id } = useParams();
  const user = useAuth((s) => s.user);
  const action = useAction();
  const course = useQuery({
    queryKey: ["course", id],
    queryFn: () => get<Course>(`/public/courses/${id}`),
  });
  const c = course.data;
  return (
    <State query={course}>
      {c && (
        <>
          <div className="breadcrumbs">
            <Link to="/">Khám phá</Link> / {c.category}
          </div>
          <section className="course-detail-hero">
            <div className="course-detail-summary">
              <span className="badge">{c.category}</span>
              <h1 className="mt-4">{c.title}</h1>
              <p className="course-introduction">{courseIntroduction(c)}</p>
              <div className="detail-facts"><span><Users size={17} /> {c.enrollments} học viên</span><span><BookOpen size={17} /> {c.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) || 0} bài học</span>{Boolean(c.reviews?.length) && <span><Star size={17} /> {(c.reviews!.reduce((sum, r) => sum + r.rating, 0) / c.reviews!.length).toFixed(1)} ({c.reviews!.length} đánh giá)</span>}</div>
              <Link
                className="text-brand font-bold mt-4 block"
                to={`/instructors/${c.ownerId}`}
              >
                Giảng viên: {c.instructor}
              </Link>
            </div>
            <div className="course-purchase-card panel stack">
              <div className="course-purchase-cover">
                <img src={c.coverId ? mediaUrl(c.coverId) : "/icon.png"} alt={c.coverId ? c.title : ""} className={c.coverId ? "" : "placeholder"} />
              </div>
              <h2 className="text-brand">{money(c.price)}</h2>
              <span className="text-muted text-sm">
                {c.enrollments} học viên đã đăng ký
              </span>
              {c.enrolled ? (
                <a className="button" href="#curriculum">
                  Tiếp tục học
                </a>
              ) : user ? (
                <button
                  disabled={action.isPending}
                  onClick={() =>
                    action.mutate(
                      {
                        path: `/courses/${id}/${c.price ? "checkout" : "enroll"}`,
                      },
                      {
                        onSuccess: (data) => {
                          if (data.url) window.location.assign(data.url);
                        },
                      },
                    )
                  }
                >
                  {c.price ? "Mua khóa học" : "Đăng ký miễn phí"}
                </button>
              ) : (
                <Link className="button" to="/login">
                  Đăng nhập để học
                </Link>
              )}
              {user && (
                <button
                  className="secondary"
                  onClick={() =>
                    action.mutate({
                      path: `/courses/${id}/bookmark`,
                      method: "put",
                    })
                  }
                >
                  <Bookmark size={17} /> Lưu khóa học
                </button>
              )}
            </div>
          </section>
          <div className="detail-content">
          <div className="detail-navigation"><a href="#description">Giới thiệu</a><a href="#curriculum">Nội dung khóa học</a><a href="#reviews">Đánh giá</a></div>
          <section id="description" className="stack course-description">
            <h2>Mô tả khóa học</h2>
            <RichContent value={c.description} />
          </section>
          <div className="detail-sections">
            <div id="curriculum" className="stack curriculum-section">
              <h2>Nội dung khóa học</h2>
              <p className="text-muted text-sm">{c.chapters?.length || 0} chương · {c.chapters?.reduce((sum, ch) => sum + ch.lessons.length, 0) || 0} bài học</p>
              {c.chapters?.map((ch, index) => (
                <details className="curriculum-chapter" key={ch.id} open={index === 0}>
                  <summary><ChevronDown size={18} /><strong>{ch.title}</strong><span>{ch.lessons.length} bài học</span></summary>
                  {ch.lessons.map((l) => (
                    <Link
                      className="lesson-row"
                      key={l.id}
                      to={`/courses/${id}/learn/${l.id}`}
                    >
                      <span className="flex gap-2 items-center">
                        {l.kind === "VIDEO" ? (
                          <Play size={15} />
                        ) : (
                          <BookOpen size={15} />
                        )}{" "}
                        {l.title}
                      </span>
                      {l.preview ? (
                        <span className="text-brand">Học thử</span>
                      ) : !c.enrolled ? (
                        <Lock size={15} />
                      ) : null}
                    </Link>
                  ))}
                </details>
              ))}
              {!c.chapters?.length && <p className="text-muted">Nội dung khóa học đang được cập nhật.</p>}
            </div>
            <div id="reviews" className="stack review-section">
              <h2>Đánh giá học viên</h2>
              {c.reviews?.length ? (
                c.reviews.map((r) => (
                  <div className="border-b border-line pb-3" key={r.id}>
                    <div className="flex justify-between">
                      <strong>{r.name}</strong>
                      <span className="flex items-center text-amber gap-1">
                        {r.rating}
                        <Star size={14} />
                      </span>
                    </div>
                    <p>{r.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted">Chưa có đánh giá.</p>
              )}
              {c.enrolled && (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget);
                    action.mutate({
                      path: `/courses/${id}/review`,
                      method: "put",
                      data: {
                        rating: Number(d.get("rating")),
                        body: d.get("body"),
                      },
                    });
                  }}
                >
                  <Field label="Điểm đánh giá">
                    <select name="rating">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Trải nghiệm của bạn">
                    <textarea name="body" required maxLength={5000} />
                  </Field>
                  <button disabled={action.isPending}>Gửi đánh giá</button>
                </form>
              )}
            </div>
          </div>
          </div>
        </>
      )}
    </State>
  );
}
export function CourseCollection({
  bookmarks = false,
}: {
  bookmarks?: boolean;
}) {
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: [bookmarks ? "bookmarks" : "learning", page],
    queryFn: () =>
      get<Course[]>(
        (bookmarks ? "/me/bookmarks" : "/me/courses") + `?page=${page}`,
      ),
  });
  return (
    <>
      <Heading
        title={bookmarks ? "Khóa học đã lưu" : "Khóa học của tôi"}
        description={
          bookmarks
            ? "Những chủ đề bạn muốn khám phá tiếp theo."
            : "Tiếp tục từ nơi bạn đã dừng lại."
        }
      />
      <State query={query}>
        {query.data?.length ? (
          <div className="course-grid">
            {query.data.map((c) => (
              <CourseCard course={c} bookmark={bookmarks} key={c.id} />
            ))}
          </div>
        ) : (
          <Empty
            text={
              bookmarks
                ? "Bạn chưa lưu khóa học nào"
                : "Bạn chưa đăng ký khóa học nào"
            }
          >
            <Link className="button" to="/">
              Khám phá khóa học
            </Link>
          </Empty>
        )}
        <ArrayPager
          page={page}
          count={query.data?.length || 0}
          onChange={setPage}
        />
      </State>
    </>
  );
}
export function InstructorProfile() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["instructor", id],
    queryFn: () =>
      get<{ name: string; bio: string; avatarId?: string; courses: Course[] }>(
        `/public/instructors/${id}`,
      ),
  });
  return (
    <State query={query}>
      {query.data && (
        <>
          <div className="instructor-identity">
            <Avatar name={query.data.name} avatarId={query.data.avatarId} className="profile-avatar" decorative />
            <Heading title={query.data.name} description={query.data.bio} />
          </div>
          <div className="course-grid">
            {query.data.courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      )}
    </State>
  );
}
