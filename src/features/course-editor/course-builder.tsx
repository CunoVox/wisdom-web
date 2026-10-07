import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CircleAlert,
  Eye,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { Badge, useAction } from "../../components/ui";
import { get } from "../../lib/api";
import type { Category, Chapter, Course, Lesson } from "../../types";
import { CurriculumTab } from "./curriculum-tab";
import { InformationTab } from "./information-tab";
import { LessonEditor } from "./lesson-editor";
import { OverviewTab } from "./overview-tab";
import { SettingsTab } from "./settings-tab";
import { StudentsTab } from "./students-tab";
import { useLessonVideoUploads } from "./use-video-uploads";

type CourseTab =
  | "overview"
  | "information"
  | "curriculum"
  | "students"
  | "settings";

const tabs: {
  id: CourseTab;
  label: string;
  description: string;
  icon: ReactNode;
}[] = [
  {
    id: "overview",
    label: "Tổng quan",
    description: "Trạng thái và tiến độ",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "information",
    label: "Thông tin khóa học",
    description: "Tên, mô tả, ảnh và giá",
    icon: <FileText size={18} />,
  },
  {
    id: "curriculum",
    label: "Nội dung khóa học",
    description: "Chương và bài học",
    icon: <BookOpen size={18} />,
  },
  {
    id: "students",
    label: "Học viên",
    description: "Người đã đăng ký",
    icon: <Users size={18} />,
  },
  {
    id: "settings",
    label: "Cài đặt",
    description: "Trạng thái và vùng nguy hiểm",
    icon: <Settings size={18} />,
  },
];

export function CourseBuilder({ course }: { course: Course }) {
  const action = useAction();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") as CourseTab | null;
  const activeTab = tabs.some((tab) => tab.id === requestedTab)
    ? (requestedTab as CourseTab)
    : "overview";

  const [cover, setCover] = useState(course.coverId || "");
  const [editLesson, setEditLesson] = useState<{
    chapter: Chapter;
    lesson?: Lesson;
  } | null>(null);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => get<Category[]>("/public/categories"),
    enabled: activeTab === "information",
  });

  const students = useQuery({
    queryKey: ["learners", course.id],
    queryFn: () =>
      get<{ name: string; createdAt: string }[]>(
        `/instructor/courses/${course.id}/learners`,
      ),
    enabled: activeTab === "students",
  });

  const {
    uploads,
    activeCount: activeVideoUploads,
    startVideoUpload,
    retryVideoUpload,
  } = useLessonVideoUploads(course.id);

  useEffect(() => setCover(course.coverId || ""), [course.coverId]);

  const chapters = course.chapters || [];
  const lessons = useMemo(
    () => chapters.flatMap((chapter) => chapter.lessons),
    [chapters],
  );
  const chapterCount = chapters.length;
  const lessonCount = lessons.length;
  const videoLessons = lessons.filter((lesson) => lesson.kind === "VIDEO");
  const incompleteVideos = videoLessons.some((lesson) => !lesson.videoReady);
  const frozen = course.enrollments > 0 || course.status === "PENDING";

  const readiness = [
    {
      label: "Thông tin cơ bản",
      ready: Boolean(
        course.title && course.introduction && course.description,
      ),
    },
    { label: "Ảnh bìa", ready: Boolean(course.coverId) },
    { label: "Có ít nhất một chương", ready: chapterCount > 0 },
    { label: "Có ít nhất một bài học", ready: lessonCount > 0 },
    {
      label: "Video đã sẵn sàng",
      ready: !incompleteVideos && activeVideoUploads === 0,
    },
  ];

  const readyCount = readiness.filter((item) => item.ready).length;
  const completion = Math.round((readyCount / readiness.length) * 100);
  const canSubmit =
    ["DRAFT", "REJECTED"].includes(course.status) &&
    readiness.every((item) => item.ready) &&
    !action.isPending;

  const changeTab = (tab: CourseTab) => setSearchParams({ tab });

  return (
    <div className="course-builder">
      <header className="course-builder-topbar">
        <div className="course-builder-title">
          <Link className="course-builder-back" to="/instructor/courses">
            <ArrowLeft size={16} />
            Khóa học giảng dạy
          </Link>

          <div className="course-builder-title-row">
            <h1>{course.title}</h1>
            <Badge value={course.status} />
          </div>

          <div className="course-builder-meta">
            <span>{chapterCount} chương</span>
            <span>·</span>
            <span>{lessonCount} bài học</span>
            {activeVideoUploads > 0 && (
              <>
                <span>·</span>
                <span className="course-upload-meta">
                  Đang tải {activeVideoUploads} video
                </span>
              </>
            )}
          </div>
        </div>

        <div className="course-builder-header-actions">
          <Link className="button secondary" to={`/courses/${course.id}`}>
            <Eye size={16} />
            Xem trước
          </Link>
          <button
            disabled={!canSubmit}
            title={
              activeVideoUploads > 0
                ? "Chờ video tải xong trước khi gửi duyệt"
                : incompleteVideos
                  ? "Một số bài Video chưa có video"
                  : lessonCount === 0
                    ? "Khóa học cần ít nhất một bài học"
                    : !course.coverId
                      ? "Thêm ảnh bìa trước khi gửi duyệt"
                      : undefined
            }
            onClick={() =>
              action.mutate({
                path: `/instructor/courses/${course.id}/submit`,
              })
            }
          >
            {activeVideoUploads > 0
              ? `Đang tải ${activeVideoUploads} video…`
              : "Gửi duyệt"}
          </button>
        </div>
      </header>

      {frozen && (
        <div className="course-builder-notice">
          <CircleAlert size={18} />
          <span>
            Khóa đang duyệt hoặc đã có học viên nên không thể sửa cấu trúc.
          </span>
        </div>
      )}

      {course.reason && (
        <div className="course-builder-feedback">
          <CircleAlert size={18} />
          <div>
            <strong>Phản hồi từ quản lý</strong>
            <p>{course.reason}</p>
          </div>
        </div>
      )}

      <div className="course-builder-layout">
        <aside
          className="course-builder-navigation"
          aria-label="Quản lý khóa học"
        >
          <div className="course-builder-progress-mini">
            <div>
              <span>Mức độ hoàn thiện</span>
              <strong>{completion}%</strong>
            </div>
            <div className="course-builder-progress-bar">
              <span style={{ width: `${completion}%` }} />
            </div>
          </div>

          <nav>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => changeTab(tab.id)}
              >
                {tab.icon}
                <span>
                  <strong>{tab.label}</strong>
                  <small>{tab.description}</small>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="course-builder-content">
          {activeTab === "overview" && (
            <OverviewTab
              course={course}
              chapterCount={chapterCount}
              lessonCount={lessonCount}
              completion={completion}
              readiness={readiness}
              uploads={uploads}
              canSubmit={canSubmit}
              actionPending={action.isPending}
              onSubmit={() =>
                action.mutate({
                  path: `/instructor/courses/${course.id}/submit`,
                })
              }
              onOpenCurriculum={() => changeTab("curriculum")}
            />
          )}

          {activeTab === "information" && (
            <InformationTab
              course={course}
              cover={cover}
              setCover={setCover}
              categories={categories.data || []}
              frozen={frozen}
            />
          )}

          {activeTab === "curriculum" && (
            <CurriculumTab
              course={course}
              frozen={frozen}
              uploads={uploads}
              setEditLesson={setEditLesson}
              retryVideoUpload={retryVideoUpload}
            />
          )}

          {activeTab === "students" && (
            <StudentsTab course={course} students={students} />
          )}

          {activeTab === "settings" && <SettingsTab course={course} />}
        </main>
      </div>

      {editLesson && (
        <LessonEditor
          courseId={course.id}
          chapter={editLesson.chapter}
          lesson={editLesson.lesson}
          startVideoUpload={startVideoUpload}
          close={() => setEditLesson(null)}
        />
      )}
    </div>
  );
}
