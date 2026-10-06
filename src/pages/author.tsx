import { useRef, useState } from "react";
import { RichEditor } from "../components/rich-editor";
import { categoryRows } from "../components/category-picker";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, FileText, FileVideo, Paperclip, Plus, RefreshCw, Upload, X } from "lucide-react";
import { api, errorMessage, get, money } from "../lib/api";
import {
  Heading,
  State,
  Empty,
  Field,
  Badge,
  useAction,
} from "../components/ui";
import { FileUpload } from "../components/file-upload";
import type { Course, Category, Chapter, Lesson, StoredFile } from "../types";
import { ArrayPager } from "../components/array-pager";
import { toast } from "sonner";
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
type VideoUploadTask = {
  lessonId: string;
  chapterId: string;
  file: File;
  fileName: string;
  progress: number;
  phase: "uploading" | "attaching" | "error";
  lesson: Lesson;
  uploadedFileId?: string;
  error?: string;
};

function Editor({ course: c }: { course?: Course }) {
  const nav = useNavigate();
  const action = useAction();
  const queryClient = useQueryClient();
  const [cover, setCover] = useState(c?.coverId || "");
  const [videoUploads, setVideoUploads] = useState<Record<string, VideoUploadTask>>({});
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
  const activeVideoUploads = Object.values(videoUploads).filter(
    (task) => task.phase !== "error",
  ).length;
  const incompleteVideos = Boolean(
    c?.chapters?.some((chapter) =>
      chapter.lessons.some(
        (lesson) => lesson.kind === "VIDEO" && !lesson.videoReady,
      ),
    ),
  );

  const updateVideoTask = (
    lessonId: string,
    patch: Partial<VideoUploadTask>,
  ) => {
    setVideoUploads((current) => {
      const task = current[lessonId];
      return task
        ? { ...current, [lessonId]: { ...task, ...patch } }
        : current;
    });
  };

  const finishVideoTask = (lessonId: string) => {
    setVideoUploads((current) => {
      const next = { ...current };
      delete next[lessonId];
      return next;
    });
  };

  const attachVideo = async (task: VideoUploadTask, fileId: string) => {
    updateVideoTask(task.lessonId, {
      phase: "attaching",
      uploadedFileId: fileId,
      progress: 100,
      error: undefined,
    });
    await api.put(
      `/instructor/courses/${c?.id}/chapters/${task.chapterId}/lessons/${task.lessonId}`,
      {
        title: task.lesson.title,
        position: task.lesson.position,
        kind: task.lesson.kind,
        body: task.lesson.body || "",
        preview: task.lesson.preview,
        videoId: fileId,
        attachmentId: task.lesson.attachmentId || null,
      },
    );
    finishVideoTask(task.lessonId);
    await queryClient.invalidateQueries({ queryKey: ["course", c?.id] });
    toast.success(`Video "${task.lesson.title}" đã tải xong`);
  };

  const runVideoUpload = async (task: VideoUploadTask) => {
    try {
      let fileId = task.uploadedFileId;
      if (!fileId) {
        updateVideoTask(task.lessonId, {
          phase: "uploading",
          progress: 0,
          error: undefined,
        });
        const data = new FormData();
        data.append("file", task.file);
        const result = await api.post<StoredFile>(
          "/files?purpose=LESSON",
          data,
          {
            onUploadProgress: (event) => {
              if (!event.total) return;
              updateVideoTask(task.lessonId, {
                progress: Math.min(
                  99,
                  Math.round((event.loaded / event.total) * 100),
                ),
              });
            },
          },
        );
        fileId = result.data.id;
      }
      await attachVideo(task, fileId);
    } catch (error) {
      const message = errorMessage(error);
      updateVideoTask(task.lessonId, {
        phase: "error",
        error: message,
      });
      toast.error(`Tải video thất bại: ${message}`);
    }
  };

  const startVideoUpload = (
    file: File,
    lesson: Lesson,
    chapterId: string,
  ) => {
    const task: VideoUploadTask = {
      lessonId: lesson.id,
      chapterId,
      file,
      fileName: file.name,
      progress: 0,
      phase: "uploading",
      lesson,
    };
    setVideoUploads((current) => ({
      ...current,
      [lesson.id]: task,
    }));
    void runVideoUpload(task);
  };

  const retryVideoUpload = (task: VideoUploadTask) => {
    const next: VideoUploadTask = {
      ...task,
      phase: task.uploadedFileId ? "attaching" : "uploading",
      error: undefined,
    };
    setVideoUploads((current) => ({
      ...current,
      [task.lessonId]: next,
    }));
    void runVideoUpload(next);
  };
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
                action.isPending ||
                activeVideoUploads > 0 ||
                incompleteVideos ||
                !["DRAFT", "REJECTED"].includes(c.status)
              }
              title={
                activeVideoUploads > 0
                  ? "Chờ video tải xong trước khi gửi duyệt"
                  : incompleteVideos
                    ? "Một số bài Video chưa có video"
                    : undefined
              }
              onClick={() =>
                action.mutate({ path: `/instructor/courses/${c.id}/submit` })
              }
            >
              {activeVideoUploads > 0
                ? `Đang tải ${activeVideoUploads} video…`
                : "Gửi duyệt"}
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
                  {ch.lessons.map((l) => {
                    const upload = videoUploads[l.id];
                    return (
                      <div key={l.id} className="lesson-row lesson-builder-row">
                        <span className="lesson-row-main">
                          <span>
                            {l.position + 1}. {l.title}{" "}
                            {l.preview && <Badge value="Học thử" />}
                          </span>
                          {l.kind === "VIDEO" && (
                            <small
                              className={
                                upload?.phase === "error"
                                  ? "lesson-video-state error"
                                  : upload
                                    ? "lesson-video-state uploading"
                                    : l.videoReady
                                      ? "lesson-video-state ready"
                                      : "lesson-video-state warning"
                              }
                            >
                              {upload?.phase === "error"
                                ? "Upload video lỗi"
                                : upload?.phase === "attaching"
                                  ? "Đang hoàn tất video…"
                                  : upload
                                    ? `Đang tải video ${upload.progress}%`
                                    : l.videoReady
                                      ? "Video sẵn sàng"
                                      : "Chưa có video"}
                            </small>
                          )}
                        </span>
                        <div className="flex gap-2">
                          {upload?.phase === "error" && (
                            <button
                              className="secondary"
                              onClick={() => retryVideoUpload(upload)}
                            >
                              <RefreshCw size={15} />
                              Thử lại
                            </button>
                          )}
                          <button
                            disabled={frozen || Boolean(upload && upload.phase !== "error")}
                            className="secondary"
                            onClick={() =>
                              setEditLesson({ chapter: ch, lesson: l })
                            }
                          >
                            Sửa
                          </button>
                          <button
                            className="danger"
                            disabled={frozen || Boolean(upload)}
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
                    );
                  })}
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
            {activeVideoUploads > 0 && (
              <p className="notice">
                Có {activeVideoUploads} video đang tải nền. Bạn vẫn có thể tiếp
                tục chỉnh sửa khóa học.
              </p>
            )}
            {incompleteVideos && activeVideoUploads === 0 && (
              <p className="notice">
                Một số bài Video chưa có video. Hoàn tất upload trước khi gửi
                duyệt.
              </p>
            )}
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
          startVideoUpload={startVideoUpload}
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
  startVideoUpload,
  close,
}: {
  courseId: string;
  chapter: Chapter;
  lesson?: Lesson;
  startVideoUpload: (file: File, lesson: Lesson, chapterId: string) => void;
  close: () => void;
}) {
  const q = useQuery({
    queryKey: ["lesson", lesson?.id],
    queryFn: () => get<Lesson>(`/public/lessons/${lesson?.id}`),
    enabled: Boolean(lesson),
  });
  return (
    <div className="modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Soạn bài học"
        className="modal lesson-modal"
      >
        <div className="lesson-modal-header">
          <div>
            <span>Chương {chapter.position + 1}</span>
            <h2>{lesson ? "Sửa bài học" : "Thêm bài học"}</h2>
            <p>{chapter.title}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        {lesson ? (
          <State query={q}>
            {q.data && (
              <LessonForm
                courseId={courseId}
                chapter={chapter}
                lesson={q.data}
                startVideoUpload={startVideoUpload}
                close={close}
              />
            )}
          </State>
        ) : (
          <LessonForm
            courseId={courseId}
            chapter={chapter}
            startVideoUpload={startVideoUpload}
            close={close}
          />
        )}
      </section>
    </div>
  );
}

function LessonForm({
  courseId,
  chapter,
  lesson: l,
  startVideoUpload,
  close,
}: {
  courseId: string;
  chapter: Chapter;
  lesson?: Lesson;
  startVideoUpload: (file: File, lesson: Lesson, chapterId: string) => void;
  close: () => void;
}) {
  const action = useAction();
  const videoInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"ARTICLE" | "VIDEO">(
    (l?.kind as "ARTICLE" | "VIDEO") || "ARTICLE",
  );
  const [videoFile, setVideoFile] = useState<File>();
  const [dragVideo, setDragVideo] = useState(false);
  const [attachmentId, setAttachment] = useState(l?.attachmentId || "");
  const [showAttachment, setShowAttachment] = useState(Boolean(l?.attachmentId));

  const chooseVideo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Vui lòng chọn một file video hợp lệ.");
      return;
    }
    setVideoFile(file);
  };

  return (
    <form
      className="lesson-form"
      onSubmit={(e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(e.currentTarget));
        action.mutate(
          {
            path: `/instructor/courses/${courseId}/chapters/${chapter.id}/lessons${l ? "/" + l.id : ""}`,
            method: l ? "put" : "post",
            data: {
              title: d.title,
              body: d.body,
              kind,
              position: l?.position ?? chapter.lessons.length,
              preview: d.preview === "on",
              videoId: kind === "VIDEO" ? l?.videoId || null : null,
              attachmentId: attachmentId || null,
            },
          },
          {
            onSuccess: (saved: Lesson) => {
              if (kind === "VIDEO" && videoFile) {
                startVideoUpload(videoFile, saved, chapter.id);
                toast.success(
                  "Bài học đã lưu. Video sẽ tiếp tục tải ở chế độ nền.",
                );
              }
              close();
            },
          },
        );
      }}
    >
      <div className="lesson-form-body">
        <Field label="Tiêu đề bài học">
          <input
            name="title"
            defaultValue={l?.title}
            required
            maxLength={200}
            placeholder="Ví dụ: Giới thiệu tổng quan về JavaScript"
          />
        </Field>

        <section className="lesson-form-section">
          <div className="lesson-section-heading">
            <div>
              <strong>Loại bài học</strong>
              <small>Chọn định dạng nội dung chính của bài.</small>
            </div>
          </div>
          <div className="lesson-kind-picker">
            <button
              type="button"
              className={kind === "ARTICLE" ? "selected" : ""}
              onClick={() => {
                setKind("ARTICLE");
                setVideoFile(undefined);
              }}
            >
              <FileText size={20} />
              <span>
                <strong>Bài viết</strong>
                <small>Nội dung văn bản, ảnh và tài liệu.</small>
              </span>
            </button>
            <button
              type="button"
              className={kind === "VIDEO" ? "selected" : ""}
              onClick={() => setKind("VIDEO")}
            >
              <FileVideo size={20} />
              <span>
                <strong>Video</strong>
                <small>Video là nội dung chính của bài.</small>
              </span>
            </button>
          </div>
        </section>

        {kind === "VIDEO" && (
          <section className="lesson-form-section">
            <div className="lesson-section-heading">
              <div>
                <strong>Video bài học</strong>
                <small>
                  Bạn có thể lưu bài ngay. Video sẽ tiếp tục tải sau khi đóng cửa
                  sổ này.
                </small>
              </div>
            </div>
            <input
              ref={videoInput}
              className="sr-only"
              type="file"
              accept="video/*"
              onChange={(event) => {
                chooseVideo(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <div
              className={`lesson-video-picker ${dragVideo ? "drag-active" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragVideo(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragVideo(true);
              }}
              onDragLeave={() => setDragVideo(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragVideo(false);
                chooseVideo(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="lesson-video-icon">
                <FileVideo size={28} />
              </span>
              <div>
                <strong>
                  {videoFile
                    ? videoFile.name
                    : l?.videoId
                      ? "Video hiện tại đã sẵn sàng"
                      : "Thêm video cho bài học"}
                </strong>
                <small>
                  {videoFile
                    ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB · sẽ tải nền sau khi lưu`
                    : "Kéo thả video vào đây hoặc chọn file từ máy."}
                </small>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => videoInput.current?.click()}
              >
                <Upload size={16} />
                {videoFile || l?.videoId ? "Chọn video khác" : "Chọn video"}
              </button>
            </div>
          </section>
        )}

        <section className="lesson-form-section">
          <div className="lesson-section-heading">
            <div>
              <strong>
                {kind === "VIDEO"
                  ? "Mô tả / nội dung bổ sung"
                  : "Nội dung bài học"}
              </strong>
              <small>
                {kind === "VIDEO"
                  ? "Thêm ghi chú, tài liệu tham khảo hoặc nội dung đi kèm video."
                  : "Soạn nội dung bài học. Có thể kéo thả hoặc dán ảnh trực tiếp."}
              </small>
            </div>
          </div>
          <RichEditor name="body" defaultValue={l?.body} />
        </section>

        <section className="lesson-preview-option">
          <div>
            <strong>Cho phép học thử</strong>
            <small>
              Học viên chưa mua khóa học có thể mở và xem toàn bộ bài này.
            </small>
          </div>
          <label className="lesson-switch">
            <input
              type="checkbox"
              name="preview"
              defaultChecked={l?.preview}
              aria-label="Cho phép học thử"
            />
            <span />
          </label>
        </section>

        <section className="lesson-form-section">
          <div className="lesson-section-heading lesson-attachment-heading">
            <div>
              <strong>Tài liệu đính kèm</strong>
              <small>PDF, slide hoặc file hỗ trợ cho bài học.</small>
            </div>
            {!showAttachment && (
              <button
                type="button"
                className="secondary"
                onClick={() => setShowAttachment(true)}
              >
                <Paperclip size={16} />
                Thêm tài liệu
              </button>
            )}
          </div>
          {showAttachment && (
            <div className="lesson-attachment-upload">
              <FileUpload
                label={attachmentId ? "Thay tài liệu" : "Tải tài liệu"}
                purpose="LESSON"
                kind="file"
                value={attachmentId}
                onUploaded={(file) => setAttachment(file.id)}
              />
              {attachmentId && (
                <button
                  type="button"
                  className="secondary self-start"
                  onClick={() => {
                    setAttachment("");
                    setShowAttachment(false);
                  }}
                >
                  Bỏ tài liệu
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="lesson-modal-actions">
        <button type="button" className="secondary" onClick={close}>
          Hủy
        </button>
        <button disabled={action.isPending}>
          {action.isPending
            ? "Đang lưu…"
            : videoFile
              ? "Lưu và tải video nền"
              : "Lưu bài học"}
        </button>
      </div>
    </form>
  );
}
