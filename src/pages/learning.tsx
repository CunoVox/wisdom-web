import { useEffect, useRef, useState } from "react";
import { RichContent } from "../components/rich-content";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { get, mediaUrl, api, refresh } from "../lib/api";
import { useAuth } from "../store/auth";
import { State, Heading, useAction, Field } from "../components/ui";
import type { Course, Lesson } from "../types";
import { toast } from "sonner";
import { ArrayPager } from "../components/array-pager";
import { ArrowLeft, ArrowRight, BookOpen, Play } from "lucide-react";
type Comment = { id: string; name: string; body: string; parentId?: string };
export function Learning() {
  const { id, lessonId } = useParams();
  const user = useAuth((s) => s.user);
  const action = useAction();
  const video = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);
  const [reply, setReply] = useState<string | null>(null);
  const [commentPage, setCommentPage] = useState(0);
  const course = useQuery({
    queryKey: ["course", id],
    queryFn: () => get<Course>(`/public/courses/${id}`),
  });
  const lesson = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => get<Lesson>(`/public/lessons/${lessonId}`),
  });
  const comments = useQuery({
    queryKey: ["comments", lessonId, commentPage],
    queryFn: () =>
      get<Comment[]>(
        `/public/lessons/${lessonId}/comments?page=${commentPage}`,
      ),
    enabled: lesson.isSuccess,
  });
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(
      () => {
        void refresh().catch(() => {});
      },
      10 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [user]);
  useEffect(() => {
    lastSaved.current = 0;
    setReply(null);
    setCommentPage(0);
  }, [lessonId]);
  const l = lesson.data;
  const lessons = course.data?.chapters?.flatMap(ch => ch.lessons) || [];
  const position = lessons.findIndex(item => item.id === lessonId);
  const previous = position > 0 ? lessons[position - 1] : undefined;
  const next = position >= 0 ? lessons[position + 1] : undefined;
  useEffect(() => {
    if (!course.data?.enrolled || !lesson.data) return;
    void api
      .put(`/lessons/${lessonId}/progress`, {
        seconds: lesson.data.seconds || 0,
        completed: lesson.data.completed || false,
      })
      .catch(() =>
        toast.error("Chưa lưu được bài đang học. Vui lòng kiểm tra kết nối.", {
          id: "progress-save",
        }),
      );
  }, [lessonId, course.data?.enrolled, lesson.isSuccess]);
  function savePosition() {
    if (!course.data?.enrolled || !video.current) return;
    lastSaved.current = Date.now();
    void api
      .put(`/lessons/${lessonId}/progress`, {
        seconds: Math.floor(video.current.currentTime),
        completed: l?.completed || false,
      })
      .catch(() =>
        toast.error("Chưa lưu được tiến độ. Vui lòng kiểm tra kết nối.", {
          id: "progress-save",
        }),
      );
  }
  return (
    <>
      <div className="breadcrumbs"><Link to={`/courses/${id}`}><ArrowLeft size={14} className="inline mr-2" />Về khóa học</Link></div>
      <Heading
        title={l?.title || "Không gian học tập"}
        description={course.data?.title}
      />
      <div className="learning-grid study-grid">
        <div className="stack">
          <State query={lesson}>
            {l && (
              <section className="panel stack lesson-content">
                {l.videoId && (
                  <video
                    ref={video}
                    key={l.videoId}
                    controls
                    className="w-full rounded-lg bg-black"
                    src={mediaUrl(l.videoId)}
                    onPause={savePosition}
                    onLoadedMetadata={() => {
                      if (video.current)
                        video.current.currentTime = l.seconds || 0;
                    }}
                    onTimeUpdate={() => {
                      if (
                        course.data?.enrolled &&
                        video.current &&
                        Date.now() - lastSaved.current > 15000
                      ) {
                        savePosition();
                      }
                    }}
                  />
                )}
                <RichContent value={l.body || "Nội dung video và tài liệu đính kèm bên dưới."} />
                {l.attachmentId && (
                  <a
                    className="button secondary"
                    href={mediaUrl(l.attachmentId)}
                  >
                    Tải tài liệu đính kèm
                  </a>
                )}
                {course.data?.enrolled && (
                  <button
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({
                        path: `/lessons/${lessonId}/progress`,
                        method: "put",
                        data: {
                          seconds: Math.floor(
                            video.current?.currentTime || l.seconds || 0,
                          ),
                          completed: !l.completed,
                        },
                      })
                    }
                  >
                    {l.completed
                      ? "Đã hoàn thành · Đánh dấu chưa học"
                      : "Đánh dấu hoàn thành"}
                  </button>
                )}
              </section>
            )}
          </State>
          {l && <div className="lesson-navigation">{previous && <Link to={`/courses/${id}/learn/${previous.id}`}><ArrowLeft size={16} /> Bài trước</Link>}{next && <Link to={`/courses/${id}/learn/${next.id}`}>Bài tiếp theo <ArrowRight size={16} /></Link>}</div>}
          {lesson.isSuccess && <>
          <section className="panel stack">
            <h2>Thảo luận bài học</h2>
            <State query={comments}>
              <ArrayPager
                page={commentPage}
                size={50}
                count={comments.data?.length || 0}
                onChange={setCommentPage}
              />
              {comments.data?.map((c) => (
                <article
                  className={`border-b border-line py-3 ${c.parentId ? "ml-6" : ""}`}
                  key={c.id}
                >
                  <strong>{c.name}</strong>
                  <p>{c.body}</p>
                  {user && (
                    <button
                      className="icon-button"
                      onClick={() => setReply(c.id)}
                    >
                      Trả lời
                    </button>
                  )}
                </article>
              ))}
              {comments.data?.length === 0 && (
                <p className="text-muted">Hãy bắt đầu cuộc thảo luận.</p>
              )}
            </State>
            {user && lesson.isSuccess && (
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const body = new FormData(form).get("body");
                  action.mutate(
                    {
                      path: `/lessons/${lessonId}/comments`,
                      data: { body, parentId: reply },
                    },
                    {
                      onSuccess: () => {
                        form.reset();
                        setReply(null);
                      },
                    },
                  );
                }}
              >
                {reply && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setReply(null)}
                  >
                    Đang trả lời · Hủy
                  </button>
                )}
                <Field label="Bình luận">
                  <textarea name="body" required maxLength={5000} />
                </Field>
                <button disabled={action.isPending}>Gửi bình luận</button>
              </form>
            )}
          </section>
          </>}
        </div>
        <details className="panel study-curriculum" open>
          <summary>Nội dung khóa học</summary>
          <State query={course}>
          {course.data?.chapters?.map((ch) => (
            <section key={ch.id}>
              <h3 className="mb-2">{ch.title}</h3>
              {ch.lessons.map((l) => (
                <Link
                  className={`lesson-row ${lessonId === l.id ? "bg-soft text-brand font-bold" : ""}`}
                  aria-current={lessonId === l.id ? "page" : undefined}
                  key={l.id}
                  to={`/courses/${id}/learn/${l.id}`}
                >
                  <span className="flex items-center gap-2">{l.kind === "VIDEO" ? <Play size={15} /> : <BookOpen size={15} />}{l.title}</span>
                  {l.preview && <small>Học thử</small>}
                </Link>
              ))}
            </section>
          ))}
          </State>
        </details>
      </div>
    </>
  );
}
