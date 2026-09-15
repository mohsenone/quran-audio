import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-accent border-t-transparent", className)}
      role="status"
      aria-label="در حال بارگذاری"
    />
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="mb-3 text-ink2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg bg-accent px-4 py-2 text-sm text-white">
          تلاش دوباره
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-10 text-center text-ink2">{message}</p>;
}
