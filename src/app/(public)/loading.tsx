export default function PublicLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-ivory" role="status" aria-label="Loading page">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
        <span className="h-3 w-3 rounded-full bg-brand" />
      </span>
      <p className="eyebrow">Loading</p>
    </div>
  );
}
