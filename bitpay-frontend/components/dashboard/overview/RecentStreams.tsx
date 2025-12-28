import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import Link from "next/link";
import { StreamWithId, StreamStatus, microToDisplay } from "@/lib/contracts/config";

interface RecentStreamsProps {
  streams: StreamWithId[];
}

export function RecentStreams({ streams }: RecentStreamsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Streams</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/streams" className="text-xs">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {streams.length > 0 ? (
          streams.slice(0, 3).map((stream) => (
            <Link
              key={stream.id.toString()}
              href={`/dashboard/streams/${stream.id}`}
              className="flex items-center justify-between p-2 rounded-md border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full ${stream.status === StreamStatus.ACTIVE ? 'bg-brand-pink/10' : 'bg-muted'}`}>
                  <Activity className={`h-3 w-3 ${stream.status === StreamStatus.ACTIVE ? 'text-brand-pink' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-xs">
                  <p className="font-medium">Stream #{stream.id.toString()}</p>
                  <p className="text-muted-foreground">{microToDisplay(stream.amount)} sBTC</p>
                </div>
              </div>
              <Badge variant={stream.status === StreamStatus.ACTIVE ? 'default' : 'secondary'} className="text-xs py-0">
                {stream.status}
              </Badge>
            </Link>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-6 w-6 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No streams yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
