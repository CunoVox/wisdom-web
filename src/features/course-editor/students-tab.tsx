import type { UseQueryResult } from "@tanstack/react-query";
import { Empty, State } from "../../components/ui";
import type { Course } from "../../types";

type Student = { name: string; createdAt: string };

export function StudentsTab({
  course,
  students,
}: {
  course: Course;
  students: UseQueryResult<Student[]>;
}) {
  return (
    <div className="course-builder-tab">
      <div className="course-tab-heading">
        <div>
          <span>Học viên</span>
          <h2>Học viên đã đăng ký</h2>
          <p>{course.enrollments} học viên trong khóa học.</p>
        </div>
      </div>

      <State query={students}>
        {students.data?.length ? (
          <div className="course-students-table">
            <div className="course-students-head">
              <span>Học viên</span>
              <span>Ngày đăng ký</span>
            </div>

            {students.data.map((student, index) => (
              <div
                className="course-student-row"
                key={`${student.name}-${index}`}
              >
                <div className="course-student-avatar">
                  {student.name.trim().charAt(0).toUpperCase()}
                </div>
                <strong>{student.name}</strong>
                <span>
                  {new Date(student.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="Chưa có học viên đăng ký" />
        )}
      </State>
    </div>
  );
}
