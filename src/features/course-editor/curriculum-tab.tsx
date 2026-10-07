import { useState } from "react";
import {
  BookOpen,
  FileText,
  FileVideo,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Badge, useAction } from "../../components/ui";
import type { Chapter, Course, Lesson } from "../../types";
import type { VideoUploadTask } from "./use-video-uploads";

export function CurriculumTab({
  course,
  frozen,
  uploads,
  setEditLesson,
  retryVideoUpload,
}: {
  course: Course;
  frozen: boolean;
  uploads: Record<string, VideoUploadTask>;
  setEditLesson: (value: { chapter: Chapter; lesson?: Lesson } | null) => void;
  retryVideoUpload: (task: VideoUploadTask) => void;
}) {
  const action = useAction();
  const [chapterEditor, setChapterEditor] = useState<Chapter | "new" | null>(
    null,
  );
  const chapters = course.chapters || [];
  const lessonCount = chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0,
  );

  return (
    <div className="course-builder-tab">
      <div className="course-tab-heading course-tab-heading-actions">
        <div>
          <span>Nội dung khóa học</span>
          <h2>Chương và bài học</h2>
          <p>
            {chapters.length} chương · {lessonCount} bài học
          </p>
        </div>
        <button disabled={frozen} onClick={() => setChapterEditor("new")}>
          <Plus size={16} />
          Thêm chương
        </button>
      </div>

      {chapterEditor && (
        <ChapterComposer
          courseId={course.id}
          chapter={chapterEditor === "new" ? undefined : chapterEditor}
          nextPosition={chapters.length}
          onClose={() => setChapterEditor(null)}
        />
      )}

      <div className="course-curriculum-stack">
        {chapters.map((chapter) => (
          <section key={chapter.id} className="course-chapter-card">
            <div className="course-chapter-header">
              <div>
                <span>Chương {chapter.position + 1}</span>
                <h3>{chapter.title}</h3>
                <small>{chapter.lessons.length} bài học</small>
              </div>

              <div className="course-chapter-actions">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Sửa chương ${chapter.title}`}
                  title="Sửa chương"
                  disabled={frozen}
                  onClick={() => setChapterEditor(chapter)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  className="icon-button danger-icon"
                  aria-label={`Xóa chương ${chapter.title}`}
                  title="Xóa chương"
                  disabled={frozen}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Xóa chương "${chapter.title}"? Chương phải không còn bài học.`,
                      )
                    ) {
                      action.mutate({
                        path: `/instructor/chapters/${chapter.id}`,
                        method: "delete",
                      });
                    }
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="lesson-curriculum-list">
              {chapter.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  frozen={frozen}
                  upload={uploads[lesson.id]}
                  onEdit={() => setEditLesson({ chapter, lesson })}
                  onRetry={retryVideoUpload}
                />
              ))}

              {!chapter.lessons.length && (
                <div className="lesson-curriculum-empty">
                  <FileText size={22} />
                  <span>Chương này chưa có bài học.</span>
                </div>
              )}
            </div>

            <button
              disabled={frozen}
              className="lesson-add-button"
              onClick={() => setEditLesson({ chapter })}
            >
              <Plus size={16} />
              Thêm bài học
            </button>
          </section>
        ))}

        {!chapters.length && (
          <section className="course-builder-empty-callout">
            <BookOpen size={28} />
            <div>
              <h3>Chưa có nội dung</h3>
              <p>Tạo chương đầu tiên để bắt đầu xây dựng khóa học.</p>
            </div>
            <button disabled={frozen} onClick={() => setChapterEditor("new")}>
              <Plus size={16} />
              Tạo chương đầu tiên
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function ChapterComposer({
  courseId,
  chapter,
  nextPosition,
  onClose,
}: {
  courseId: string;
  chapter?: Chapter;
  nextPosition: number;
  onClose: () => void;
}) {
  const action = useAction();

  return (
    <form
      className="chapter-composer"
      onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        action.mutate(
          {
            path: `/instructor/courses/${courseId}/chapters${chapter ? "/" + chapter.id : ""}`,
            method: chapter ? "put" : "post",
            data: {
              title: values.title,
              position: chapter?.position ?? nextPosition,
            },
          },
          { onSuccess: onClose },
        );
      }}
    >
      <div>
        <strong>{chapter ? "Sửa chương" : "Thêm chương mới"}</strong>
        <small>
          {chapter
            ? "Cập nhật tên chương."
            : "Chương mới sẽ được thêm vào cuối khóa học."}
        </small>
      </div>
      <input
        name="title"
        defaultValue={chapter?.title}
        autoFocus
        required
        placeholder="Tên chương..."
      />
      <button disabled={action.isPending}>
        {action.isPending ? "Đang lưu…" : chapter ? "Lưu" : "Thêm"}
      </button>
      <button type="button" className="secondary" onClick={onClose}>
        Hủy
      </button>
    </form>
  );
}

function LessonRow({
  lesson,
  frozen,
  upload,
  onEdit,
  onRetry,
}: {
  lesson: Lesson;
  frozen: boolean;
  upload?: VideoUploadTask;
  onEdit: () => void;
  onRetry: (task: VideoUploadTask) => void;
}) {
  const action = useAction();
  const videoLabel =
    upload?.phase === "error"
      ? "Upload video lỗi"
      : upload?.phase === "attaching"
        ? "Đang hoàn tất video…"
        : upload
          ? `Đang tải video ${upload.progress}%`
          : lesson.videoReady
            ? "Video sẵn sàng"
            : "Chưa có video";

  return (
    <article className="lesson-curriculum-item">
      <div className="lesson-curriculum-index">{lesson.position + 1}</div>
      <div
        className={`lesson-curriculum-icon ${lesson.kind === "VIDEO" ? "video" : "article"}`}
        aria-hidden="true"
      >
        {lesson.kind === "VIDEO" ? (
          <FileVideo size={19} />
        ) : (
          <FileText size={19} />
        )}
      </div>

      <div className="lesson-curriculum-main">
        <div className="lesson-curriculum-title">
          <strong>{lesson.title}</strong>
          <span className="lesson-kind-label">
            {lesson.kind === "VIDEO" ? "Video" : "Bài viết"}
          </span>
          {lesson.preview && <Badge value="Học thử" />}
          {lesson.attachmentId && (
            <span
              className="lesson-attachment-chip"
              title="Có tài liệu đính kèm"
            >
              <Paperclip size={12} />
              Tài liệu
            </span>
          )}
        </div>

        {lesson.kind === "VIDEO" && (
          <div className="lesson-video-progress-wrap">
            <small
              className={
                upload?.phase === "error"
                  ? "lesson-video-state error"
                  : upload
                    ? "lesson-video-state uploading"
                    : lesson.videoReady
                      ? "lesson-video-state ready"
                      : "lesson-video-state warning"
              }
            >
              {videoLabel}
            </small>

            {upload?.phase === "uploading" && (
              <div className="lesson-upload-progress">
                <span style={{ width: `${upload.progress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lesson-curriculum-actions">
        {upload?.phase === "error" && (
          <button
            type="button"
            className="secondary"
            onClick={() => onRetry(upload)}
          >
            <RefreshCw size={14} />
            Thử lại
          </button>
        )}

        <button
          type="button"
          className="secondary"
          disabled={frozen || Boolean(upload && upload.phase !== "error")}
          onClick={onEdit}
        >
          <Pencil size={14} />
          Sửa
        </button>

        <button
          type="button"
          className="icon-button danger-icon"
          aria-label={`Xóa bài ${lesson.title}`}
          title="Xóa bài"
          disabled={frozen || Boolean(upload)}
          onClick={() => {
            if (window.confirm(`Xóa bài "${lesson.title}"?`)) {
              action.mutate({
                path: `/instructor/lessons/${lesson.id}`,
                method: "delete",
              });
            }
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
