import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Zap, FileText, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button size="sm" className="w-full justify-start bg-brand-pink hover:bg-brand-pink/90" asChild>
          <Link href="/dashboard/streams/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Stream
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/bulk">
            <Zap className="mr-2 h-4 w-4" />
            Bulk Create
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/templates">
            <FileText className="mr-2 h-4 w-4" />
            Use Template
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="w-full justify-start" asChild>
          <Link href="/dashboard/marketplace">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Marketplace
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
