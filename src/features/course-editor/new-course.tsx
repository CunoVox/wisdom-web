import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { categoryRows } from "../../components/category-picker";
import { FileUpload } from "../../components/file-upload";
import { RichEditor } from "../../components/rich-editor";
import { Field, useAction } from "../../components/ui";
import { get } from "../../lib/api";
import type { Category, Course } from "../../types";

export function NewCourse() {
  const nav = useNavigate();
  const action = useAction();
  const [cover, setCover] = useState("");
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/public/categories"),
  });

  return (
    <div className="course-builder course-builder-new">
      <header className="course-builder-topbar course-builder-topbar-new">
        <div>
          <Link className="course-builder-back" to="/instructor/courses">
            <ArrowLeft size={16} />
            Khóa học giảng dạy
          </Link>
          <h1>Tạo khóa học mới</h1>
          <p>
            Bắt đầu với thông tin cơ bản. Sau khi tạo, bạn sẽ xây dựng chương và
            bài học.
          </p>
        </div>
      </header>

      <form
        className="course-new-card"
        onSubmit={(event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          action.mutate(
            {
              path: "/instructor/courses",
              data: {
                ...values,
                price: Number(values.price),
                coverId: cover || null,
              },
            },
            {
              onSuccess: (created: Course) =>
                nav(`/instructor/courses/${created.id}?tab=curriculum`),
            },
          );
        }}
      >
        <section className="course-builder-section">
          <div className="course-section-heading">
            <span>01</span>
            <div>
              <h2>Thông tin cơ bản</h2>
              <p>Cho học viên biết khóa học này giúp họ đạt được điều gì.</p>
            </div>
          </div>

          <div className="stack">
            <Field label="Tên khóa học">
              <input
                name="title"
                required
                maxLength={200}
                placeholder="Ví dụ: JavaScript từ cơ bản đến thực chiến"
              />
            </Field>

            <Field label="Giới thiệu ngắn">
              <textarea
                name="introduction"
                required
                maxLength={500}
                rows={4}
                placeholder="Mô tả ngắn giá trị chính của khóa học"
              />
            </Field>

            <Field label="Mô tả khóa học">
              <RichEditor name="description" required maxLength={20000} />
            </Field>
          </div>
        </section>

        <section className="course-builder-section">
          <div className="course-section-heading">
            <span>02</span>
            <div>
              <h2>Ảnh và phân loại</h2>
              <p>Thiết lập ảnh bìa, danh mục và mức giá ban đầu.</p>
            </div>
          </div>

          <div className="course-information-grid">
            <FileUpload
              variant="cover"
              label="Ảnh bìa khóa học"
              description="Ảnh xuất hiện ở trang khám phá và trang chi tiết khóa học."
              purpose="COVER"
              value={cover}
              onUploaded={(file) => setCover(file.id)}
            />

            <div className="stack">
              <Field label="Danh mục">
                <select name="categoryId" required defaultValue="">
                  <option value="">Chọn danh mục</option>
                  {categoryRows(categories.data || []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {"— ".repeat(category.depth)}
                      {category.name}
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
                  defaultValue={0}
                  required
                />
              </Field>
            </div>
          </div>
        </section>

        <div className="course-new-actions">
          <Link className="button secondary" to="/instructor/courses">
            Hủy
          </Link>
          <button disabled={action.isPending}>
            {action.isPending ? "Đang tạo…" : "Tạo khóa học"}
          </button>
        </div>
      </form>
    </div>
  );
}
