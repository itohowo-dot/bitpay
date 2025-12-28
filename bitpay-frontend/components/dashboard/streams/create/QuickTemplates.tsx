"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface QuickTemplatesProps {
  onTemplateSelect: (template: {
    amount: string;
    duration: string;
    durationType: "blocks" | "days" | "weeks" | "months";
    description: string;
  }) => void;
}

export function QuickTemplates({ onTemplateSelect }: QuickTemplatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Templates</CardTitle>
        <CardDescription>Pre-configured payment schedules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start text-left h-auto py-4"
          onClick={() =>
            onTemplateSelect({
              amount: "2.5",
              duration: "30",
              durationType: "days",
              description: "Monthly salary payment",
            })
          }
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <div className="font-medium">Monthly Salary</div>
              <div className="text-xs text-muted-foreground">2.5 sBTC over 30 days</div>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start text-left h-auto py-4"
          onClick={() =>
            onTemplateSelect({
              amount: "1.0",
              duration: "7",
              durationType: "days",
              description: "Weekly project payment",
            })
          }
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <div className="font-medium">Weekly Project</div>
              <div className="text-xs text-muted-foreground">1.0 sBTC over 7 days</div>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start text-left h-auto py-4"
          onClick={() =>
            onTemplateSelect({
              amount: "0.5",
              duration: "1000",
              durationType: "blocks",
              description: "Short-term payment",
            })
          }
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-medium">Quick Payment</div>
              <div className="text-xs text-muted-foreground">0.5 sBTC over 1000 blocks</div>
            </div>
          </div>
        </Button>

        <Separator className="my-4" />

        <Link href="/dashboard/templates">
          <Button variant="ghost" className="w-full" size="sm">
            View All Templates →
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
