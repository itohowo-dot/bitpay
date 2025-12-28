"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function ImportantNotes() {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-600" />
          Important Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
          <li className="flex gap-2">
            <span>•</span>
            <span>Streams cannot be modified once created</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Recipients can withdraw vested amounts anytime</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Cancelling returns only unvested amounts</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Ensure sufficient sBTC balance before creating</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Network fees apply for stream creation</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
