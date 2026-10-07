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
          <div className="course-card-meta-row">
            <span className="course-instructor">{c.instructor}</span>
            {c.totalLessons === undefined && (
              <span className="course-student-count">
                <Users size={13} />
                {c.enrollments || 0} học viên
              </span>
            )}
          </div>
          {c.totalLessons !== undefined && (
            <div className="course-progress-meta">
              <progress
                className="w-full accent-brand"
                value={c.completed || 0}
                max={c.totalLessons || 1}
              />
              <small>
                {c.completed}/{c.totalLessons} bài hoàn thành
              </small>
            </div>
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
  const setQ = (value: string) =>
    setParams(
      (previous) => {
        if (value) previous.set("q", value);
        else previous.delete("q");
        previous.delete("page");
        return previous;
      },
      { replace: true },
    );
  const setCategory = (value: string) =>
    setParams(
      (previous) => {
        if (value) previous.set("category", value);
        else previous.delete("category");
        previous.delete("page");
        return previous;
      },
      { replace: true },
    );
  const [sort, setSort] = useState("newest");
  const page = Math.max(0, Number(params.get("page")) || 0);
  const setPage = (value: number) =>
    setParams(
      (previous) => {
        previous.set("page", String(value));
        return previous;
      },
      { replace: true },
    );

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/public/categories"),
  });
  const courses = useQuery({
    queryKey: ["catalog", q, category, sort, page],
    queryFn: () =>
      get<Page<Course>>(
        `/public/courses?${new URLSearchParams({
          q,
          category,
          sort,
          page: String(page),
          size: "12",
        })}`,
      ),
  });

  const roots = (cats.data || []).filter((item) => !item.parentId);
  const popularRoots = roots.slice(0, 6);
  const filtered = Boolean(q || category);
  const activeCategory = cats.data?.find((item) => item.id === category);

  return (
    <>
      <div className="discovery-intro">
        <section className="discovery-hero" aria-labelledby="home-title">
          <div className="discovery-hero-inner">
            <div className="discovery-copy">
              <h1 id="home-title">
                Học điều mới.
                <br />
                <span>Mở lối</span>
                <br />
                tương lai.
              </h1>
              <p>
                Khám phá điều bạn muốn học, thực hành từng bước và tiến xa hơn
                mỗi ngày cùng Wisdom.
              </p>
              <a className="button hero-cta" href="#courses">
                Khám phá khóa học <ArrowUpRight size={20} />
              </a>
              <div className="hero-note">
                <BookOpen size={18} />
                Kiến thức thực tế. Nhịp học của riêng bạn.
              </div>
            </div>

            <motion.div
              className="discovery-art"
              initial={false}
              animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <img
                src="/visuals/learning-about.webp"
                alt="Học viên trao đổi và tự học với tài liệu"
                width={600}
                height={581}
                fetchPriority="high"
              />
            </motion.div>
          </div>
        </section>

        <section className="discovery-benefits" aria-label="Lợi ích học tập">
          <div className="discovery-benefits-inner">
            {([
              [BookOpen, "Khóa học trực tuyến", "Khám phá nhiều chủ đề mới"],
              [
                Check,
                "Giảng viên kinh nghiệm",
                "Tìm khóa học phù hợp với bạn",
              ],
              [Clock, "Truy cập trọn đời", "Học theo lịch trình của bạn"],
            ] as const).map(([Icon, title, description]) => (
              <div className="discovery-benefit" key={title}>
                <span className="discovery-benefit-icon">
                  <Icon size={27} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <div>
                  <h2>{String(title)}</h2>
                  <p>{String(description)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        id="courses"
        className="catalog-section catalog-redesign catalog-redesign-compact"
        aria-labelledby="catalog-heading"
      >
        <motion.div
          className="catalog-compact-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div>
            <span>Khám phá khóa học</span>
            <h2 id="catalog-heading">
              {q
                ? `Kết quả cho “${q}”`
                : activeCategory?.name || "Khám phá điều bạn muốn học."}
            </h2>
            <p>
              {filtered
                ? "Điều chỉnh tìm kiếm hoặc bộ lọc để khám phá thêm nội dung."
                : "Chọn một khởi đầu. Tạo nên bước tiến của riêng bạn."}
            </p>
          </div>

          {courses.data && (
            <strong className="catalog-result-total">
              {courses.data.total} khóa học
            </strong>
          )}
        </motion.div>

        <div className="catalog-toolbox">
          <div className="catalog-search-compact">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Tìm kiếm khóa học"
              placeholder="Tìm khóa học, kỹ năng hoặc chủ đề..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            {q && (
              <button type="button" onClick={() => setQ("")}>
                Xóa
              </button>
            )}
          </div>

          <div className="catalog-control-actions">
            <CategoryPicker
              categories={cats.data || []}
              value={category}
              onChange={setCategory}
            />
            <select
              aria-label="Sắp xếp"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(0);
              }}
            >
              <option value="newest">Mới nhất</option>
              <option value="priceAsc">Giá tăng dần</option>
              <option value="priceDesc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {popularRoots.length > 0 && (
          <div className="catalog-topic-strip" aria-label="Chủ đề nổi bật">
            <motion.button
              type="button"
              className={!category ? "selected" : ""}
              aria-pressed={!category}
              onClick={() => setCategory("")}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              Tất cả
            </motion.button>
            {popularRoots.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                className={category === item.id ? "selected" : ""}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                initial={reduceMotion ? false : { opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: reduceMotion ? 0 : index * 0.03,
                }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                {item.name}
              </motion.button>
            ))}
          </div>
        )}

        {filtered && (
          <div className="catalog-active-filters catalog-active-filters-row">
            {activeCategory && (
              <button type="button" onClick={() => setCategory("")}>
                {activeCategory.name} ×
              </button>
            )}
            {q && (
              <button type="button" onClick={() => setQ("")}>
                “{q}” ×
              </button>
            )}
            <button
              type="button"
              className="clear-all"
              onClick={() => setParams({})}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        <State query={courses}>
          {courses.data?.content.length ? (
            <motion.div
              className="course-grid catalog-course-grid"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.055,
                  },
                },
              }}
            >
              {courses.data.content.map((course) => (
                <motion.div
                  className="catalog-course-motion"
                  key={course.id}
                  layout={!reduceMotion}
                  variants={{
                    hidden: reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Empty text="Chưa tìm thấy khóa học phù hợp">
              <p>Thử từ khóa khác hoặc khám phá tất cả chủ đề.</p>
              {filtered && (
                <button
                  className="secondary"
                  onClick={() => setParams({})}
                >
                  Xóa bộ lọc
                </button>
              )}
            </Empty>
          )}

          {(courses.data?.total || 0) > 12 && (
            <Pager
              page={page}
              size={12}
              total={courses.data?.total || 0}
              onChange={setPage}
            />
          )}
        </State>
      </section>

      {!filtered && (
        <>
          {popularRoots.length > 0 && (
            <motion.section
              className="topic-directory topic-directory-redesign"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 0.34 }}
            >
              <div className="topic-directory-heading">
                <div>
                  <span>Khám phá theo chủ đề</span>
                  <h2>Bắt đầu từ lĩnh vực bạn yêu thích</h2>
                </div>
                <a href="#courses">Xem khóa học ↑</a>
              </div>

              <div className="topic-directory-grid">
                {popularRoots.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.25,
                      delay: reduceMotion ? 0 : index * 0.04,
                    }}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                  >
                    <Link
                      to={`/?category=${encodeURIComponent(item.id)}#courses`}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{item.name}</strong>
                      <ArrowUpRight size={18} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            className="teaching-banner"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.34 }}
          >
            <div>
              <h2>Biến kinh nghiệm của bạn thành bài học.</h2>
              <p>
                Chia sẻ kiến thức, xây dựng khóa học và đồng hành cùng học viên
                trên Wisdom.
              </p>
            </div>
            <Link className="button secondary" to="/profile">
              Trở thành giảng viên <ArrowRight size={17} />
            </Link>
          </motion.section>
        </>
      )}
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
