"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

interface EmptyTemplatesProps {
  onCreateClick: () => void;
}

export function EmptyTemplates({ onCreateClick }: EmptyTemplatesProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No templates yet</p>
          <p className="text-sm mb-4">Create your first stream template</p>
          <Button
            onClick={onCreateClick}
            className="bg-brand-pink hover:bg-brand-pink/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
