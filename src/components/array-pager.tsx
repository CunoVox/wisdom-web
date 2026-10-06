export function ArrayPager({
  page,
  count,
  size = 25,
  onChange,
}: {
  page: number;
  count: number;
  size?: number;
  onChange: (page: number) => void;
}) {
  if (page === 0 && count < size) return null;
  return (
    <div className="pager">
      <button
        className="secondary"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Trước
      </button>
      <span>Trang {page + 1}</span>
      <button
        className="secondary"
        disabled={count < size}
        onClick={() => onChange(page + 1)}
      >
        Sau
      </button>
    </div>
  );
}
