import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-800 text-zinc-100",
        success: "border-transparent bg-emerald-950 text-emerald-400",
        destructive: "border-transparent bg-red-950 text-red-400",
        warning: "border-transparent bg-yellow-950 text-yellow-400",
        info: "border-transparent bg-blue-950 text-blue-400",
        outline: "border-zinc-800 text-zinc-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? "unknown";
  const variant =
    s === "completed" ? "success"
    : s === "completed_with_warnings" ? "warning"
    : s === "failed" ? "destructive"
    : s === "running" || s === "active" ? "info"
    : "default";
  return <Badge variant={variant}>{s.replace(/_/g, " ")}</Badge>;
}
