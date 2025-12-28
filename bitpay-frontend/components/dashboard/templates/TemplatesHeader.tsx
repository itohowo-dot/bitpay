"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TemplatesHeaderProps {
  isCreating: boolean;
  onToggleCreate: () => void;
}

export function TemplatesHeader({ isCreating, onToggleCreate }: TemplatesHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Stream Templates</h1>
        <p className="text-muted-foreground">
          Save and reuse common payment stream configurations
        </p>
      </div>
      <Button
        onClick={onToggleCreate}
        className="bg-brand-pink hover:bg-brand-pink/90 text-white"
      >
        {isCreating ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Create Template</>}
      </Button>
    </div>
  );
}
