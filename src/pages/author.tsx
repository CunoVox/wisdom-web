import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ArrayPager } from "../components/array-pager";
import { Badge, Empty, Heading, State } from "../components/ui";
import { CourseBuilder } from "../features/course-editor/course-builder";
import { NewCourse } from "../features/course-editor/new-course";
import { get, money } from "../lib/api";
import type { Course } from "../types";

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
                {q.data.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <strong>{course.title}</strong>
                      {course.reason && (
                        <p className="text-amber text-xs">{course.reason}</p>
                      )}
                    </td>
                    <td>{money(course.price)}</td>
                    <td>
                      <Badge value={course.status} />
                    </td>
                    <td>{course.enrollments}</td>
                    <td>
                      <Link
                        className="text-brand font-bold"
                        to={`/instructor/courses/${course.id}`}
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

  if (fresh) return <NewCourse />;

  return (
    <State query={q}>
      {q.data && <CourseBuilder course={q.data} />}
    </State>
  );
}
