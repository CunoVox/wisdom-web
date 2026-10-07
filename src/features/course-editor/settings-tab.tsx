import { Badge, useAction } from "../../components/ui";
import type { Course } from "../../types";

export function SettingsTab({ course }: { course: Course }) {
  const action = useAction();

  return (
    <div className="course-builder-tab">
      <div className="course-tab-heading">
        <div>
          <span>Cài đặt</span>
          <h2>Cài đặt khóa học</h2>
          <p>Trạng thái và các thao tác quản lý ít sử dụng.</p>
        </div>
      </div>

      <section className="course-builder-card course-settings-status">
        <div>
          <span>Trạng thái hiện tại</span>
          <h3>{course.title}</h3>
        </div>
        <Badge value={course.status} />
      </section>

      <section className="course-danger-zone">
        <div>
          <strong>Ẩn khóa học khỏi danh mục</strong>
          <p>
            Khóa học sẽ không còn xuất hiện trong danh mục công khai. Học viên
            hiện tại vẫn có thể tiếp tục học.
          </p>
        </div>
        <button
          className="danger"
          disabled={action.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Ẩn khóa học này khỏi danh mục? Học viên hiện tại vẫn tiếp tục học được.",
              )
            ) {
              action.mutate({
                path: `/instructor/courses/${course.id}/archive`,
              });
            }
          }}
        >
          Ẩn khóa học
        </button>
      </section>
    </div>
  );
}
