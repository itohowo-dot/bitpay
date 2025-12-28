import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StreamCardSkeleton() {
  return (
    <Card className="hover:border-brand-teal/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3 w-full" />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StreamListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StreamCardSkeleton key={i} />
      ))}
    </div>
  );
}
