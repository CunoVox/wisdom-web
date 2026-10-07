import { categoryRows } from "../../components/category-picker";
import { FileUpload } from "../../components/file-upload";
import { RichEditor } from "../../components/rich-editor";
import { Field, useAction } from "../../components/ui";
import { money } from "../../lib/api";
import type { Category, Course } from "../../types";

export function InformationTab({
  course,
  cover,
  setCover,
  categories,
  frozen,
}: {
  course: Course;
  cover: string;
  setCover: (id: string) => void;
  categories: Category[];
  frozen: boolean;
}) {
  const action = useAction();
  const formKey = [
    course.id,
    course.title,
    course.introduction,
    course.description,
    course.categoryId,
    course.price,
    course.coverId,
  ].join(":");

  return (
    <div className="course-builder-tab">
      <div className="course-tab-heading">
        <div>
          <span>Thông tin khóa học</span>
          <h2>Thông tin hiển thị</h2>
          <p>Quản lý nội dung giới thiệu, ảnh bìa, danh mục và giá.</p>
        </div>
      </div>

      <form
        key={formKey}
        className="course-information-form"
        onSubmit={(event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          action.mutate({
            path: `/instructor/courses/${course.id}`,
            method: "put",
            data: {
              ...values,
              price: Number(values.price),
              coverId: cover || null,
            },
          });
        }}
      >
        <fieldset disabled={frozen || action.isPending}>
          <section className="course-builder-card course-info-section">
            <div className="course-card-heading">
              <div>
                <h3>Thông tin cơ bản</h3>
                <p>Nội dung học viên nhìn thấy trước khi đăng ký.</p>
              </div>
            </div>

            <div className="stack">
              <Field label="Tên khóa học">
                <input
                  name="title"
                  defaultValue={course.title}
                  required
                  maxLength={200}
                />
              </Field>

              <Field label="Giới thiệu ngắn">
                <textarea
                  name="introduction"
                  defaultValue={course.introduction}
                  required
                  maxLength={500}
                  rows={4}
                />
              </Field>

              <Field label="Mô tả khóa học">
                <RichEditor
                  name="description"
                  defaultValue={course.description}
                  required
                  maxLength={20000}
                />
              </Field>
            </div>
          </section>

          <section className="course-builder-card course-info-section">
            <div className="course-card-heading">
              <div>
                <h3>Ảnh bìa và phân loại</h3>
                <p>Ảnh bìa, danh mục và mức giá của khóa học.</p>
              </div>
            </div>

            <div className="course-information-grid">
              <FileUpload
                variant="cover"
                label="Ảnh bìa khóa học"
                purpose="COVER"
                value={cover}
                onUploaded={(file) => setCover(file.id)}
              />

              <div className="stack">
                <Field label="Danh mục">
                  <select
                    name="categoryId"
                    defaultValue={course.categoryId}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categoryRows(categories).map((category) => (
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
                    defaultValue={course.price}
                    required
                  />
                </Field>

                <div className="course-price-summary">
                  <span>Mức giá hiện tại</span>
                  <strong>{money(course.price)}</strong>
                </div>
              </div>
            </div>
          </section>
        </fieldset>

        <div className="course-save-bar">
          <span>
            {frozen
              ? "Khóa học hiện không thể chỉnh sửa."
              : "Thay đổi chỉ được áp dụng sau khi lưu."}
          </span>
          <button disabled={frozen || action.isPending}>
            {action.isPending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
