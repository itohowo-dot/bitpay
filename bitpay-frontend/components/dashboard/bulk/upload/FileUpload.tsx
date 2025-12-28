"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
        <CardDescription>Import your prepared CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          type="file"
          accept=".csv"
          onChange={onFileChange}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}
