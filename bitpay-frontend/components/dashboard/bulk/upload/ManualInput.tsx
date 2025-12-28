"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface ManualInputProps {
  csvData: string;
  blockHeight: number | null;
  onCsvChange: (value: string) => void;
  onParse: () => void;
  disabled: boolean;
}

export function ManualInput({
  csvData,
  blockHeight,
  onCsvChange,
  onParse,
  disabled,
}: ManualInputProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Or Paste CSV Data Manually
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={`recipient,amount,startBlock,endBlock
SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7,1.5,${blockHeight ? Number(blockHeight) + 10 : "100000"},${blockHeight ? Number(blockHeight) + 4320 : "104320"}`}
          value={csvData}
          onChange={(e) => onCsvChange(e.target.value)}
          rows={6}
          disabled={disabled}
        />
        <Button onClick={onParse} disabled={!csvData || disabled}>
          Parse CSV Data
        </Button>
      </CardContent>
    </Card>
  );
}
