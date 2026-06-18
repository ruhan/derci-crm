import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl border-2 border-dashed border-muted bg-muted/30",
        className
      )}
    >
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
