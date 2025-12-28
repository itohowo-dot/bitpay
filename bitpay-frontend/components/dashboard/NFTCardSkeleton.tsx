import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NFTCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        {/* NFT Image Placeholder with shimmer */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-full mt-4" />
      </CardContent>
    </Card>
  );
}

export function NFTGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <NFTCardSkeleton key={i} />
      ))}
    </div>
  );
}
