import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  FileVideo,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../components/file-upload";
import { RichEditor } from "../../components/rich-editor";
import { Field, State, useAction } from "../../components/ui";
import { get, mediaUrl } from "../../lib/api";
import type { Chapter, Lesson } from "../../types";

export function LessonEditor({
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
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(
    l?.videoId ? mediaUrl(l.videoId) : "",
  );
  const [dragVideo, setDragVideo] = useState(false);
  const [attachmentId, setAttachment] = useState(l?.attachmentId || "");
  const [showAttachment, setShowAttachment] = useState(Boolean(l?.attachmentId));

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(l?.videoId ? mediaUrl(l.videoId) : "");
      return;
    }

    const url = URL.createObjectURL(videoFile);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile, l?.videoId]);

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
      onSubmit={(event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));

        action.mutate(
          {
            path: `/instructor/courses/${courseId}/chapters/${chapter.id}/lessons${l ? "/" + l.id : ""}`,
            method: l ? "put" : "post",
            data: {
              title: data.title,
              body: data.body,
              kind,
              position: l?.position ?? chapter.lessons.length,
              preview: data.preview === "on",
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
                  Có thể xem preview trước khi lưu. Sau khi lưu, video tiếp tục
                  upload nền.
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
              className={`lesson-video-stage ${dragVideo ? "drag-active" : ""}`}
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
              {videoPreviewUrl ? (
                <div className="lesson-video-preview">
                  <video
                    key={videoPreviewUrl}
                    src={videoPreviewUrl}
                    controls
                    preload="metadata"
                  />
                  <div className="lesson-video-preview-meta">
                    <div>
                      <strong>
                        {videoFile ? videoFile.name : "Video bài học"}
                      </strong>
                      <small>
                        {videoFile
                          ? `${(videoFile.size / 1024 / 1024).toFixed(1)} MB · preview trước khi upload`
                          : "Video đã lưu trên hệ thống"}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => videoInput.current?.click()}
                    >
                      <Upload size={16} />
                      Thay video
                    </button>
                  </div>
                </div>
              ) : (
                <div className="lesson-video-picker">
                  <span className="lesson-video-icon">
                    <FileVideo size={30} />
                  </span>
                  <div>
                    <strong>Thêm video cho bài học</strong>
                    <small>
                      Kéo thả video vào đây hoặc chọn file từ máy. Sau khi chọn,
                      bạn có thể xem preview trước khi lưu.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => videoInput.current?.click()}
                  >
                    <Upload size={16} />
                    Chọn video
                  </button>
                </div>
              )}
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
