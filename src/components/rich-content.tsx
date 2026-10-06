import DOMPurify from "dompurify";

export function contentHtml(value = "") {
  const html = /<\/?(?:p|h[1-6]|ul|ol|li|div|br|img|strong|em|blockquote)\b/i.test(value)
    ? value : value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "h2", "h3", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote", "pre", "code", "hr", "a", "img"],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "width", "height", "start"],
    ALLOW_DATA_ATTR: false,
  });
}
export function RichContent({ value }: { value?: string }) {
  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: contentHtml(value) }} />;
}
