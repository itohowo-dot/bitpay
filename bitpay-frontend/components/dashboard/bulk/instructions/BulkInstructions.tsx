"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function BulkInstructions() {
  return (
    <Card className="border-brand-teal/20 bg-brand-teal/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-brand-teal" />
          How to Use Bulk Creation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ol className="list-decimal list-inside space-y-2">
          <li>Download the CSV template and fill in your stream details</li>
          <li>Upload the completed CSV file or paste the data manually</li>
          <li>Review the parsed streams in the table below</li>
          <li>Click "Process All Streams" to create them sequentially</li>
        </ol>
        <p className="text-muted-foreground">
          <strong>CSV Format:</strong> recipient,amount,startBlock,endBlock (one stream per line)
        </p>
      </CardContent>
    </Card>
  );
}
