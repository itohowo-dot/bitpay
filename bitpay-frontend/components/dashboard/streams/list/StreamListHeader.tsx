"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function StreamListHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Payment Streams</h1>
        <p className="text-muted-foreground">
          Manage your Bitcoin streaming payments
        </p>
      </div>

      <Button asChild className="bg-brand-pink hover:bg-brand-pink/90 text-white">
        <Link href="/dashboard/streams/create">
          <Plus className="mr-2 h-4 w-4" />
          Create Stream
        </Link>
      </Button>
    </div>
  );
}
