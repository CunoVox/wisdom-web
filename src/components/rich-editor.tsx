import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { toast } from "sonner";
import { mediaUrl } from "../lib/api";
import { FileUpload } from "./file-upload";
import { contentHtml } from "./rich-content";

export function RichEditor({ name, defaultValue = "", required = false, maxLength = 100000 }: {
  name: string; defaultValue?: string; required?: boolean; maxLength?: number;
}) {
  const [html, setHtml] = useState(() => contentHtml(defaultValue));
  const [busy, setBusy] = useState(false);
  const hidden = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image.configure({ allowBase64: false })],
    content: contentHtml(defaultValue),
    shouldRerenderOnTransaction: true,
    editorProps: { attributes: { class: "rich-content", role: "textbox", "aria-label": name === "description" ? "Mô tả khóa học" : "Nội dung bài học", "aria-multiline": "true" } },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });
  useEffect(() => {
    const form = hidden.current?.form;
    const check = (event: Event) => {
      if (busy || (required && editor?.isEmpty) || html.length > maxLength) {
        event.preventDefault(); event.stopImmediatePropagation();
        toast.error(busy ? "Vui lòng chờ ảnh tải xong." : html.length > maxLength ? "Nội dung quá dài. Vui lòng rút gọn." : "Vui lòng nhập nội dung.");
        editor?.commands.focus();
      }
    };
    form?.addEventListener("submit", check, true);
    return () => form?.removeEventListener("submit", check, true);
  }, [busy, html, required, maxLength, editor]);
  if (!editor) return null;
  const tool = (label: string, action: () => void, active = false) => <button type="button" className={active ? "" : "secondary"} aria-pressed={active} onClick={action}>{label}</button>;
  return <div className="rich-editor">
    <input ref={hidden} type="hidden" name={name} value={html} />
    <div className="editor-toolbar" role="toolbar" aria-label="Định dạng nội dung">
      {tool("Đậm", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {tool("Nghiêng", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {tool("Gạch chân", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
      {tool("Tiêu đề", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading"))}
      {tool("Danh sách", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {tool("Đánh số", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {tool("Trích dẫn", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {tool("Liên kết", () => { const url = window.prompt("Nhập liên kết https://", editor.getAttributes("link").href || ""); if (url === null) return; if (!url) { editor.chain().focus().unsetLink().run(); return; } if (!/^https?:\/\//i.test(url)) { toast.error("Vui lòng nhập liên kết http:// hoặc https://"); return; } editor.chain().focus().setLink({ href: url }).run(); })}
      {tool("Hoàn tác", () => editor.chain().focus().undo().run())}
      {tool("Làm lại", () => editor.chain().focus().redo().run())}
    </div>
    <EditorContent editor={editor} />
    <FileUpload label="Tải ảnh nội dung" purpose="EDITOR_IMAGE" onBusyChange={setBusy} onUploaded={file => {
      if (!editor.isDestroyed) editor.commands.setImage({ src: file.viewUrl || mediaUrl(file.id), alt: file.name });
    }} />
  </div>;
}
