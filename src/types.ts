export type User = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "MANAGER" | "ADMIN";
  bio?: string;
  avatarId?: string;
  verified: boolean;
  locked: boolean;
  instructorRequest: boolean;
};
export type Lesson = {
  id: string;
  chapterId: string;
  title: string;
  position: number;
  kind: "ARTICLE" | "VIDEO";
  preview: boolean;
  body?: string;
  videoId?: string;
  attachmentId?: string;
  seconds?: number;
  completed?: boolean;
};
export type Chapter = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};
export type Course = {
  id: string;
  ownerId: string;
  categoryId: string;
  title: string;
  introduction?: string;
  description: string;
  price: number;
  status: string;
  reason?: string;
  coverId?: string;
  instructor: string;
  category: string;
  enrollments: number;
  enrolled?: boolean;
  chapters?: Chapter[];
  reviews?: { id: string; name: string; rating: number; body: string }[];
  lastLessonId?: string;
  completed?: number;
  totalLessons?: number;
};
export type Category = { id: string; name: string; parentId?: string | null };
export type StoredFile = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  purpose: string;
  state: string;
};
export type Page<T> = { content: T[]; total: number };
export type Order = {
  id: string;
  courseId: string;
  amount: number;
  status: string;
  createdAt: string;
  transactionNo?: string;
};
