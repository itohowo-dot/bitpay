"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Plus } from "lucide-react";

interface EmptyStreamStateProps {
  activeTab: string;
}

export function EmptyStreamState({ activeTab }: EmptyStreamStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {activeTab === "all" ? "No streams yet" : `No ${activeTab} streams`}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {activeTab === "all"
              ? "Create your first payment stream to start sending Bitcoin over time with automatic vesting."
              : `You don't have any ${activeTab} streams at the moment.`}
          </p>
          {activeTab === "all" && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
                <Link href="/dashboard/streams/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Stream
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/bulk-create">
                  Create Bulk Streams
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
