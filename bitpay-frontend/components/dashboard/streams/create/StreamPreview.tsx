"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Clock, Bitcoin } from "lucide-react";

interface StreamPreviewProps {
  amount: string;
  duration: string;
  durationType: string;
  estimates: {
    perSecond: string;
    perMinute: string;
    perHour: string;
    perDay: string;
  } | null;
}

export function StreamPreview({ amount, duration, durationType, estimates }: StreamPreviewProps) {
  return (
    <Card className="border-brand-pink/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-pink" />
          Stream Preview
        </CardTitle>
        <CardDescription>Real-time streaming rate calculations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {estimates ? (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-lg">{amount || "0"} sBTC</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-semibold">
                  {duration || "0"} {durationType}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Streaming Rates
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per second</span>
                  <span className="text-brand-pink font-mono font-medium">{estimates.perSecond}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per minute</span>
                  <span className="text-brand-teal font-mono font-medium">{estimates.perMinute}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per hour</span>
                  <span className="text-brand-pink font-mono font-medium">{estimates.perHour}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Per day</span>
                  <span className="text-brand-teal font-mono font-medium text-base">{estimates.perDay}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Bitcoin className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm text-muted-foreground">
              Enter amount and duration to see streaming rates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
