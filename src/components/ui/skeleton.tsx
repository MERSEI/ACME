import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent before:content-[''] before:[animation:shimmer_1.8s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
