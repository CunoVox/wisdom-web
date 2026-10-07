import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "../../lib/api";
import type { Lesson, StoredFile } from "../../types";

export type VideoUploadTask = {
  lessonId: string;
  chapterId: string;
  file: File;
  fileName: string;
  progress: number;
  phase: "uploading" | "attaching" | "error";
  lesson: Lesson;
  uploadedFileId?: string;
  error?: string;
};

export function useLessonVideoUploads(courseId: string) {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<Record<string, VideoUploadTask>>({});

  const updateTask = (lessonId: string, patch: Partial<VideoUploadTask>) => {
    setUploads((current) => {
      const task = current[lessonId];
      return task
        ? { ...current, [lessonId]: { ...task, ...patch } }
        : current;
    });
  };

  const finishTask = (lessonId: string) => {
    setUploads((current) => {
      const next = { ...current };
      delete next[lessonId];
      return next;
    });
  };

  const attachVideo = async (task: VideoUploadTask, fileId: string) => {
    updateTask(task.lessonId, {
      phase: "attaching",
      uploadedFileId: fileId,
      progress: 100,
      error: undefined,
    });

    await api.put(
      `/instructor/courses/${courseId}/chapters/${task.chapterId}/lessons/${task.lessonId}`,
      {
        title: task.lesson.title,
        position: task.lesson.position,
        kind: task.lesson.kind,
        body: task.lesson.body || "",
        preview: task.lesson.preview,
        videoId: fileId,
        attachmentId: task.lesson.attachmentId || null,
      },
    );

    finishTask(task.lessonId);
    await queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    toast.success(`Video "${task.lesson.title}" đã tải xong`);
  };

  const runUpload = async (task: VideoUploadTask) => {
    try {
      let fileId = task.uploadedFileId;

      if (!fileId) {
        updateTask(task.lessonId, {
          phase: "uploading",
          progress: 0,
          error: undefined,
        });

        const data = new FormData();
        data.append("file", task.file);

        const result = await api.post<StoredFile>("/files?purpose=LESSON", data, {
          onUploadProgress: (event) => {
            if (!event.total) return;
            updateTask(task.lessonId, {
              progress: Math.min(
                99,
                Math.round((event.loaded / event.total) * 100),
              ),
            });
          },
        });

        fileId = result.data.id;
      }

      await attachVideo(task, fileId);
    } catch (error) {
      const message = errorMessage(error);
      updateTask(task.lessonId, {
        phase: "error",
        error: message,
      });
      toast.error(`Tải video thất bại: ${message}`);
    }
  };

  const startVideoUpload = (
    file: File,
    lesson: Lesson,
    chapterId: string,
  ) => {
    const task: VideoUploadTask = {
      lessonId: lesson.id,
      chapterId,
      file,
      fileName: file.name,
      progress: 0,
      phase: "uploading",
      lesson,
    };

    setUploads((current) => ({
      ...current,
      [lesson.id]: task,
    }));
    void runUpload(task);
  };

  const retryVideoUpload = (task: VideoUploadTask) => {
    const next: VideoUploadTask = {
      ...task,
      phase: task.uploadedFileId ? "attaching" : "uploading",
      error: undefined,
    };

    setUploads((current) => ({
      ...current,
      [task.lessonId]: next,
    }));
    void runUpload(next);
  };

  return {
    uploads,
    activeCount: Object.values(uploads).filter((task) => task.phase !== "error")
      .length,
    startVideoUpload,
    retryVideoUpload,
  };
}
