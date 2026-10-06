import { useState } from "react";
import { RichEditor } from "../components/rich-editor";
import { categoryRows } from "../components/category-picker";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import { get, money } from "../lib/api";
import {
  Heading,
  State,
  Empty,
  Field,
  Badge,
  useAction,
} from "../components/ui";
import { FileUpload } from "../components/file-upload";
import type { Course, Category, Chapter, Lesson } from "../types";
import { ArrayPager } from "../components/array-pager";
export function AuthorCourses() {
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["author-courses", page],
    queryFn: () => get<Course[]>(`/instructor/courses?page=${page}`),
  });
  return (
    <>
      <Heading
        title="Khóa học giảng dạy"
        description="Tạo nội dung, gửi duyệt và theo dõi học viên."
      >
        <Link className="button" to="/instructor/courses/new">
          <Plus size={18} />
          Tạo khóa học
        </Link>
      </Heading>
      <State query={q}>
        {q.data?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Học viên</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {q.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.title}</strong>
                      {c.reason && (
                        <p className="text-amber text-xs">{c.reason}</p>
                      )}
                    </td>
                    <td>{money(c.price)}</td>
                    <td>
                      <Badge value={c.status} />
                    </td>
                    <td>{c.enrollments}</td>
                    <td>
                      <Link
                        className="text-brand font-bold"
                        to={`/instructor/courses/${c.id}`}
                      >
                        Quản lý →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Tạo khóa học đầu tiên của bạn" />
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
export function CourseEditor() {
  const { id } = useParams();
  const fresh = id === "new";
  const q = useQuery({
    queryKey: ["course", id],
    queryFn: () => get<Course>(`/public/courses/${id}`),
    enabled: !fresh,
  });
  return fresh ? (
    <Editor />
  ) : (
    <State query={q}>
      {q.data && <Editor key={q.data.id} course={q.data} />}
    </State>
  );
}
function Editor({ course: c }: { course?: Course }) {
  const nav = useNavigate();
  const action = useAction();
  const [cover, setCover] = useState(c?.coverId || "");
  const [editLesson, setEditLesson] = useState<{
    chapter: Chapter;
    lesson?: Lesson;
  } | null>(null);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/public/categories"),
  });
  const students = useQuery({
    queryKey: ["learners", c?.id],
    queryFn: () =>
      get<{ name: string; createdAt: string }[]>(
        `/instructor/courses/${c?.id}/learners`,
      ),
    enabled: Boolean(c),
  });
  const frozen = Boolean(c && (c.enrollments > 0 || c.status === "PENDING"));
  return (
    <>
      <Heading
        title={c ? "Quản lý khóa học" : "Khóa học mới"}
        description="Lưu nội dung trước, sau đó gửi quản lý duyệt."
      >
        {c && (
          <div className="flex gap-2">
            <Link className="button secondary" to={`/courses/${c.id}`}>
              Xem trước
            </Link>
            <button
              disabled={
                action.isPending || !["DRAFT", "REJECTED"].includes(c.status)
              }
              onClick={() =>
                action.mutate({ path: `/instructor/courses/${c.id}/submit` })
              }
            >
              Gửi duyệt
            </button>
          </div>
        )}
      </Heading>
      {frozen && (
        <p className="notice mb-5">
          Khóa đang duyệt hoặc đã có học viên nên không thể sửa cấu trúc. Bạn có
          thể ẩn khỏi danh mục; học viên cũ vẫn được học.
        </p>
      )}
      <div className="learning-grid">
        <div className="stack">
          <section className="panel stack">
            <h2>Thông tin khóa học</h2>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                const values = Object.fromEntries(
                  new FormData(e.currentTarget),
                );
                action.mutate(
                  {
                    path: `/instructor/courses${c ? "/" + c.id : ""}`,
                    method: c ? "put" : "post",
                    data: {
                      ...values,
                      price: Number(values.price),
                      coverId: cover || null,
                    },
                  },
                  {
                    onSuccess: (data) => {
                      if (!c) nav(`/instructor/courses/${data.id}`);
                    },
                  },
                );
              }}
            >
              <fieldset disabled={frozen || action.isPending} className="stack">
                <Field label="Tên khóa học">
                  <input
                    name="title"
                    defaultValue={c?.title}
                    required
                    maxLength={200}
                  />
                </Field>
                <Field label="Giới thiệu ngắn">
                  <textarea
                    name="introduction"
                    defaultValue={c?.introduction}
                    required
                    maxLength={500}
                    rows={4}
                    placeholder="Tóm tắt ngắn gọn giá trị và nội dung chính của khóa học"
                  />
                </Field>
                <Field label="Mô tả khóa học">
                  <RichEditor
                    name="description"
                    defaultValue={c?.description}
                    required
                    maxLength={20000}
                  />
                </Field>
                <div className="course-media-grid"><div className="stack">
                  <Field label="Danh mục">
                    <select
                      name="categoryId"
                      defaultValue={c?.categoryId}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categoryRows(cats.data || []).map((x) => (
                        <option key={x.id} value={x.id}>
                          {"— ".repeat(x.depth)}{x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Giá (VNĐ), 0 = miễn phí">
                    <input
                      name="price"
                      type="number"
                      min={0}
                      max={9999999999}
                      defaultValue={c?.price || 0}
                      required
                    />
                  </Field>
                </div>
                <FileUpload
                  variant="cover"
                  label="Ảnh bìa khóa học"
                  description="Ảnh này xuất hiện ở trang khám phá và trang chi tiết khóa học."
                  purpose="COVER"
                  value={cover}
                  onUploaded={(f) => setCover(f.id)}
                />
                </div>
                <button>Lưu bản nháp</button>
              </fieldset>
            </form>
          </section>
          {c && (
            <section className="panel stack">
              <h2>Chương và bài học</h2>
              {c.chapters?.map((ch) => (
                <div
                  key={ch.id}
                  className="border border-line rounded-xl p-4 stack"
                >
                  <div className="flex justify-between gap-2">
                    <h3>
                      {ch.position + 1}. {ch.title}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        className="secondary"
                        disabled={frozen}
                        onClick={() => setEditChapter(ch)}
                      >
                        Sửa
                      </button>
                      <button
                        className="danger"
                        disabled={frozen}
                        onClick={() =>
                          action.mutate({
                            path: `/instructor/chapters/${ch.id}`,
                            method: "delete",
                          })
                        }
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  {ch.lessons.map((l) => (
                    <div key={l.id} className="lesson-row">
                      <span>
                        {l.position + 1}. {l.title}{" "}
                        {l.preview && <Badge value="Học thử" />}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={frozen}
                          className="secondary"
                          onClick={() =>
                            setEditLesson({ chapter: ch, lesson: l })
                          }
                        >
                          Sửa
                        </button>
                        <button
                          className="danger"
                          disabled={frozen}
                          onClick={() =>
                            action.mutate({
                              path: `/instructor/lessons/${l.id}`,
                              method: "delete",
                            })
                          }
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    disabled={frozen}
                    className="secondary self-start"
                    onClick={() => setEditLesson({ chapter: ch })}
                  >
                    <Plus size={16} />
                    Thêm bài
                  </button>
                </div>
              ))}
              <form
                className="stack"
                key={editChapter?.id || "new"}
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const values = Object.fromEntries(new FormData(form));
                  action.mutate(
                    {
                      path: `/instructor/courses/${c.id}/chapters${editChapter ? "/" + editChapter.id : ""}`,
                      method: editChapter ? "put" : "post",
                      data: { ...values, position: Number(values.position) },
                    },
                    {
                      onSuccess: () => {
                        form.reset();
                        setEditChapter(null);
                      },
                    },
                  );
                }}
              >
                <h3>{editChapter ? "Sửa chương" : "Thêm chương"}</h3>
                <Field label="Tên chương">
                  <input
                    name="title"
                    defaultValue={editChapter?.title}
                    required
                    disabled={frozen}
                  />
                </Field>
                <Field label="Thứ tự (từ 0)">
                  <input
                    name="position"
                    type="number"
                    min={0}
                    defaultValue={
                      editChapter?.position ?? c.chapters?.length ?? 0
                    }
                    disabled={frozen}
                  />
                </Field>
                <button disabled={frozen || action.isPending}>
                  Lưu chương
                </button>
                {editChapter && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setEditChapter(null)}
                  >
                    Hủy sửa
                  </button>
                )}
              </form>
            </section>
          )}
        </div>
        <div className="stack">
          <section className="panel stack">
            <BookOpen className="text-brand" />
            <h3>Quy trình xuất bản</h3>
            <p className="text-muted text-sm">
              Soạn thông tin, thêm chương và bài học, kiểm tra nội dung rồi gửi
              duyệt. Người quản lý sẽ phê duyệt hoặc phản hồi lý do.
            </p>
            {c && (
              <>
                <Badge value={c.status} />
                {c.reason && <p className="notice">{c.reason}</p>}
                <button
                  className="danger"
                  onClick={() =>
                    action.mutate({
                      path: `/instructor/courses/${c.id}/archive`,
                    })
                  }
                >
                  Ẩn khỏi danh mục
                </button>
              </>
            )}
          </section>
          {c && (
            <section className="panel stack">
              <h3>Học viên đã đăng ký</h3>
              <State query={students}>
                {students.data?.length ? (
                  students.data.map((s, i) => (
                    <div key={i} className="border-b border-line pb-2">
                      <strong className="text-sm">{s.name}</strong>
                      <small className="block">
                        {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-sm">Chưa có học viên.</p>
                )}
              </State>
            </section>
          )}
        </div>
      </div>
      {editLesson && c && (
        <LessonModal
          courseId={c.id}
          chapter={editLesson.chapter}
          lesson={editLesson.lesson}
          close={() => setEditLesson(null)}
        />
      )}
    </>
  );
}
function LessonModal({
  courseId,
  chapter,
  lesson,
  close,
}: {
  courseId: string;
  chapter: Chapter;
  lesson?: Lesson;
  close: () => void;
}) {
  const q = useQuery({
    queryKey: ["lesson", lesson?.id],
    queryFn: () => get<Lesson>(`/public/lessons/${lesson?.id}`),
    enabled: Boolean(lesson),
  });
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Soạn bài học"
        className="modal panel stack"
      >
        <div className="flex justify-between">
          <h2>{lesson ? "Sửa bài học" : "Thêm bài học"}</h2>
          <button className="secondary" onClick={close}>
            Đóng
          </button>
        </div>
        {lesson ? (
          <State query={q}>
            {q.data && (
              <LessonForm
                courseId={courseId}
                chapter={chapter}
                lesson={q.data}
                close={close}
              />
            )}
          </State>
        ) : (
          <LessonForm courseId={courseId} chapter={chapter} close={close} />
        )}
      </section>
    </div>
  );
}
function LessonForm({
  courseId,
  chapter,
  lesson: l,
  close,
}: {
  courseId: string;
  chapter: Chapter;
  lesson?: Lesson;
  close: () => void;
}) {
  const action = useAction();
  const [kind, setKind] = useState(l?.kind || "ARTICLE");
  const [videoId, setVideo] = useState(l?.videoId || "");
  const [attachmentId, setAttachment] = useState(l?.attachmentId || "");
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        action.mutate(
          {
            path: `/instructor/courses/${courseId}/chapters/${chapter.id}/lessons${l ? "/" + l.id : ""}`,
            method: l ? "put" : "post",
            data: {
              ...d,
              kind,
              position: Number(d.position),
              preview: d.preview === "on",
              videoId: videoId || null,
              attachmentId: attachmentId || null,
            },
          },
          { onSuccess: close },
        );
      }}
    >
      <Field label="Tiêu đề">
        <input name="title" defaultValue={l?.title} required />
      </Field>
      <div className="form-grid">
        <Field label="Loại bài">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as "ARTICLE" | "VIDEO")}
          >
            <option value="ARTICLE">Bài viết</option>
            <option value="VIDEO">Video</option>
          </select>
        </Field>
        <Field label="Thứ tự">
          <input
            name="position"
            type="number"
            min={0}
            defaultValue={l?.position ?? chapter.lessons.length}
          />
        </Field>
      </div>
      <Field label="Nội dung">
        <RichEditor name="body" defaultValue={l?.body} />
      </Field>
      <label className="flex gap-2">
        <input type="checkbox" name="preview" defaultChecked={l?.preview} />
        Cho phép học thử
      </label>
      {kind === "VIDEO" && (
        <div className="stack">
          <h3>Video bài học</h3>
          <FileUpload label="Tải video" purpose="LESSON" kind="video" value={videoId} onUploaded={(f) => setVideo(f.id)} />
        </div>
      )}
      <h3>Tài liệu đính kèm</h3>
      <FileUpload label="Tải tài liệu" purpose="LESSON" kind="file" value={attachmentId} onUploaded={(f) => setAttachment(f.id)} />
      {attachmentId && (
        <button
          type="button"
          className="secondary"
          onClick={() => setAttachment("")}
        >
          Bỏ tài liệu đính kèm
        </button>
      )}
      <button disabled={action.isPending}>Lưu bài học</button>
    </form>
  );
}
