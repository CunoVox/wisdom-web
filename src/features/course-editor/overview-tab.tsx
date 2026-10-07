import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  FileVideo,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";
import { Badge } from "../../components/ui";
import type { Course } from "../../types";
import type { VideoUploadTask } from "./use-video-uploads";

export function OverviewTab({
  course,
  chapterCount,
  lessonCount,
  completion,
  readiness,
  uploads,
  canSubmit,
  actionPending,
  onSubmit,
  onOpenCurriculum,
}: {
  course: Course;
  chapterCount: number;
  lessonCount: number;
  completion: number;
  readiness: { label: string; ready: boolean }[];
  uploads: Record<string, VideoUploadTask>;
  canSubmit: boolean;
  actionPending: boolean;
  onSubmit: () => void;
  onOpenCurriculum: () => void;
}) {
  const uploadTasks = Object.values(uploads);

  return (
    <div className="course-builder-tab">
      <div className="course-tab-heading">
        <div>
          <span>Tổng quan</span>
          <h2>Tình trạng khóa học</h2>
          <p>Kiểm tra mức độ hoàn thiện trước khi gửi duyệt.</p>
        </div>
      </div>

      <div className="course-overview-stats">
        <article>
          <BookOpen size={20} />
          <span>Chương</span>
          <strong>{chapterCount}</strong>
        </article>
        <article>
          <FileText size={20} />
          <span>Bài học</span>
          <strong>{lessonCount}</strong>
        </article>
        <article>
          <Users size={20} />
          <span>Học viên</span>
          <strong>{course.enrollments}</strong>
        </article>
      </div>

      <div className="course-overview-grid">
        <section className="course-builder-card">
          <div className="course-card-heading">
            <div>
              <h3>Mức độ hoàn thiện</h3>
              <p>Các phần bắt buộc trước khi gửi duyệt.</p>
            </div>
            <strong className="course-completion-value">{completion}%</strong>
          </div>

          <div className="course-completion-bar">
            <span style={{ width: `${completion}%` }} />
          </div>

          <div className="course-readiness-list">
            {readiness.map((item) => (
              <div key={item.label} data-ready={item.ready}>
                {item.ready ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <CircleAlert size={18} />
                )}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="course-builder-card course-publish-card">
          <div>
            <span>Trạng thái xuất bản</span>
            <Badge value={course.status} />
          </div>
          <h3>
            {course.status === "DRAFT"
              ? "Khóa học đang ở bản nháp"
              : course.status === "REJECTED"
                ? "Khóa học cần chỉnh sửa"
                : course.status === "PENDING"
                  ? "Khóa học đang chờ duyệt"
                  : course.status === "PUBLISHED"
                    ? "Khóa học đã xuất bản"
                    : "Trạng thái khóa học"}
          </h3>
          <p>
            Hoàn thiện nội dung, kiểm tra video và xem trước trước khi gửi quản
            lý duyệt.
          </p>
          <div className="course-publish-actions">
            <Link className="button secondary" to={`/courses/${course.id}`}>
              <Eye size={16} />
              Xem trước
            </Link>
            <button disabled={!canSubmit || actionPending} onClick={onSubmit}>
              Gửi duyệt
            </button>
          </div>
        </section>
      </div>

      {uploadTasks.length > 0 && (
        <section className="course-builder-card">
          <div className="course-card-heading">
            <div>
              <h3>Video đang xử lý</h3>
              <p>Bạn có thể tiếp tục chỉnh sửa trong khi video tải nền.</p>
            </div>
          </div>

          <div className="course-upload-list">
            {uploadTasks.map((task) => (
              <div key={task.lessonId}>
                <FileVideo size={18} />
                <div>
                  <strong>{task.lesson.title}</strong>
                  <small>
                    {task.phase === "error"
                      ? task.error || "Upload thất bại"
                      : task.phase === "attaching"
                        ? "Đang hoàn tất video…"
                        : `Đang tải ${task.progress}%`}
                  </small>
                  {task.phase === "uploading" && (
                    <div className="course-upload-progress">
                      <span style={{ width: `${task.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lessonCount === 0 && (
        <section className="course-builder-empty-callout">
          <GraduationCap size={28} />
          <div>
            <h3>Bắt đầu xây dựng nội dung</h3>
            <p>Tạo chương đầu tiên và thêm bài học cho khóa học.</p>
          </div>
          <button onClick={onOpenCurriculum}>
            <Plus size={16} />
            Thêm nội dung
          </button>
        </section>
      )}
    </div>
  );
}
