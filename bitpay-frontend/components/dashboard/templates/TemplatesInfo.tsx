"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TemplatesInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Stream Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Templates allow you to save common stream configurations for quick reuse. Default templates
          are provided for salary, contracts, and vesting schedules.
        </p>
        <p>
          When you use a template, it pre-fills the stream creation form with the saved values.
          You can still modify any field before creating the actual stream.
        </p>
        <p>
          Custom templates are saved in your browser and can be edited or deleted at any time.
        </p>
      </CardContent>
    </Card>
  );
}
