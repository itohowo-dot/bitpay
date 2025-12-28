"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface TemplateDownloadProps {
  onDownload: () => void;
}

export function TemplateDownload({ onDownload }: TemplateDownloadProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Template
        </CardTitle>
        <CardDescription>Get the CSV template with example data</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={onDownload}
          className="w-full bg-brand-teal hover:bg-brand-teal/90"
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>
      </CardContent>
    </Card>
  );
}
