import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for common patterns
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-text", className)} {...props} />
}

function SkeletonTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-title", className)} {...props} />
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-avatar", className)} {...props} />
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton h-10 w-32 rounded-md", className)} {...props} />
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card-elevated p-6", className)} {...props}>
      <SkeletonTitle />
      <SkeletonText />
      <SkeletonText className="w-2/3" />
      <div className="flex gap-2 mt-4">
        <SkeletonButton />
        <SkeletonButton className="w-24" />
      </div>
    </div>
  )
}

function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={`header-${i}`} className="h-6" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonText key={`cell-${rowIndex}-${colIndex}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Loading page skeleton
function SkeletonPage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6 p-6", className)} {...props}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonTitle className="h-8 w-64" />
          <SkeletonText className="w-96" />
        </div>
        <SkeletonButton />
      </div>
      
      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      
      {/* Table */}
      <SkeletonCard className="p-6">
        <SkeletonTable />
      </SkeletonCard>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonPage 
}