import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Code2,
  Eraser,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  LoaderCircle,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, mediaUrl } from "../lib/api";
import type { StoredFile } from "../types";
import { contentHtml } from "./rich-content";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function RichEditor({
  name,
  defaultValue = "",
  required = false,
  maxLength = 100000,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const [html, setHtml] = useState(() => contentHtml(defaultValue));
  const [uploadingCount, setUploadingCount] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const hidden = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const busy = uploadingCount > 0;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: { loading: "lazy" },
      }),
    ],
    content: contentHtml(defaultValue),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "rich-content",
        role: "textbox",
        "aria-label":
          name === "description" ? "Mô tả khóa học" : "Nội dung bài học",
        "aria-multiline": "true",
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files || []).filter(
          (file) => IMAGE_TYPES.includes(file.type),
        );
        if (!files.length) return false;

        event.preventDefault();
        void uploadImages(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;

        const files = Array.from(event.dataTransfer?.files || []).filter(
          (file) => IMAGE_TYPES.includes(file.type),
        );
        if (!files.length) return false;

        event.preventDefault();
        const position = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos;

        void uploadImages(files, position);
        return true;
      },
    },
    onUpdate: ({ editor }) =>
      setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  useEffect(() => {
    const form = hidden.current?.form;
    const check = (event: Event) => {
      if (busy || (required && editor?.isEmpty) || html.length > maxLength) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toast.error(
          busy
            ? "Vui lòng chờ ảnh tải xong."
            : html.length > maxLength
              ? "Nội dung quá dài. Vui lòng rút gọn."
              : "Vui lòng nhập nội dung.",
        );
        editor?.commands.focus();
      }
    };

    form?.addEventListener("submit", check, true);
    return () => form?.removeEventListener("submit", check, true);
  }, [busy, html, required, maxLength, editor]);

  async function uploadImage(file: File, position?: number) {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.");
      return;
    }

    setUploadingCount((count) => count + 1);
    const data = new FormData();
    data.append("file", file);

    try {
      const result = await api.post<StoredFile & { viewUrl?: string }>(
        "/files?purpose=EDITOR_IMAGE",
        data,
      );
      if (!editor || editor.isDestroyed) return;

      const src = result.data.viewUrl || mediaUrl(result.data.id);
      const chain = editor.chain().focus();

      if (position !== undefined) {
        chain.setTextSelection(position);
      }

      chain
        .setImage({
          src,
          alt: result.data.name || file.name,
        })
        .run();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploadingCount((count) => Math.max(0, count - 1));
    }
  }

  async function uploadImages(files: File[], position?: number) {
    let nextPosition = position;

    for (const file of files) {
      await uploadImage(file, nextPosition);
      if (nextPosition !== undefined) nextPosition += 1;
    }
  }

  if (!editor) return null;

  const headingValue = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : "paragraph";

  const tool = ({
    label,
    active = false,
    disabled = false,
    action,
    icon,
  }: {
    label: string;
    active?: boolean;
    disabled?: boolean;
    action: () => void;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      className={`editor-tool ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={action}
    >
      {icon}
    </button>
  );

  const openLink = () => {
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkOpen(false);
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      toast.error("Vui lòng nhập liên kết bắt đầu bằng http:// hoặc https://");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
    setLinkOpen(false);
  };

  return (
    <div className="rich-editor">
      <input ref={hidden} type="hidden" name={name} value={html} />
      <input
        ref={imageInput}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void uploadImages([file]);
        }}
      />

      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Định dạng nội dung"
      >
        <div className="editor-toolbar-group">
          {tool({
            label: "Hoàn tác",
            disabled: !editor.can().chain().focus().undo().run(),
            action: () => editor.chain().focus().undo().run(),
            icon: <Undo2 size={17} />,
          })}
          {tool({
            label: "Làm lại",
            disabled: !editor.can().chain().focus().redo().run(),
            action: () => editor.chain().focus().redo().run(),
            icon: <Redo2 size={17} />,
          })}
        </div>

        <div className="editor-toolbar-group editor-toolbar-format">
          <select
            aria-label="Kiểu đoạn"
            value={headingValue}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "h2") {
                editor.chain().focus().setHeading({ level: 2 }).run();
              } else if (value === "h3") {
                editor.chain().focus().setHeading({ level: 3 }).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
          >
            <option value="paragraph">Đoạn văn</option>
            <option value="h2">Tiêu đề 2</option>
            <option value="h3">Tiêu đề 3</option>
          </select>
        </div>

        <div className="editor-toolbar-group">
          {tool({
            label: "Đậm",
            active: editor.isActive("bold"),
            action: () => editor.chain().focus().toggleBold().run(),
            icon: <Bold size={17} />,
          })}
          {tool({
            label: "Nghiêng",
            active: editor.isActive("italic"),
            action: () => editor.chain().focus().toggleItalic().run(),
            icon: <Italic size={17} />,
          })}
          {tool({
            label: "Gạch chân",
            active: editor.isActive("underline"),
            action: () => editor.chain().focus().toggleUnderline().run(),
            icon: <Underline size={17} />,
          })}
          {tool({
            label: "Gạch ngang",
            active: editor.isActive("strike"),
            action: () => editor.chain().focus().toggleStrike().run(),
            icon: <Strikethrough size={17} />,
          })}
        </div>

        <div className="editor-toolbar-group">
          {tool({
            label: "Danh sách",
            active: editor.isActive("bulletList"),
            action: () => editor.chain().focus().toggleBulletList().run(),
            icon: <List size={17} />,
          })}
          {tool({
            label: "Danh sách đánh số",
            active: editor.isActive("orderedList"),
            action: () => editor.chain().focus().toggleOrderedList().run(),
            icon: <ListOrdered size={17} />,
          })}
          {tool({
            label: "Trích dẫn",
            active: editor.isActive("blockquote"),
            action: () => editor.chain().focus().toggleBlockquote().run(),
            icon: <Quote size={17} />,
          })}
          {tool({
            label: "Khối mã",
            active: editor.isActive("codeBlock"),
            action: () => editor.chain().focus().toggleCodeBlock().run(),
            icon: <Code2 size={17} />,
          })}
        </div>

        <div className="editor-toolbar-group editor-toolbar-media">
          <div className="editor-link-control">
            {tool({
              label: editor.isActive("link") ? "Sửa liên kết" : "Thêm liên kết",
              active: editor.isActive("link"),
              action: openLink,
              icon: <LinkIcon size={17} />,
            })}
            {linkOpen && (
              <div className="editor-link-popover">
                <input
                  autoFocus
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyLink();
                    }
                    if (event.key === "Escape") {
                      setLinkOpen(false);
                      editor.commands.focus();
                    }
                  }}
                />
                <button type="button" onClick={applyLink}>
                  Áp dụng
                </button>
                <button
                  type="button"
                  className="editor-tool"
                  aria-label="Đóng"
                  title="Đóng"
                  onClick={() => {
                    setLinkOpen(false);
                    editor.commands.focus();
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {tool({
            label: "Chèn ảnh",
            disabled: busy,
            action: () => imageInput.current?.click(),
            icon: busy ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <ImagePlus size={17} />
            ),
          })}
          {tool({
            label: "Xóa định dạng",
            action: () =>
              editor.chain().focus().unsetAllMarks().clearNodes().run(),
            icon: <Eraser size={17} />,
          })}
        </div>
      </div>

      <EditorContent editor={editor} />

      <div className="editor-footer">
        <span className={busy ? "editor-uploading" : ""}>
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" size={14} />
              Đang tải {uploadingCount} ảnh...
            </>
          ) : (
            "Có thể dán ảnh từ clipboard hoặc kéo thả ảnh trực tiếp vào nội dung."
          )}
        </span>
        <span className={html.length > maxLength ? "over-limit" : ""}>
          {html.length.toLocaleString("vi-VN")} /{" "}
          {maxLength.toLocaleString("vi-VN")}
        </span>
      </div>
    </div>
  );
}
