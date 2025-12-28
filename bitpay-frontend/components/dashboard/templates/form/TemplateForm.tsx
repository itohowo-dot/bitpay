"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BLOCKS_PER_WEEK, BLOCKS_PER_MONTH } from "@/lib/contracts/config";

interface StreamTemplate {
  id: string;
  name: string;
  description: string;
  amount: string;
  durationBlocks: number;
  durationLabel: string;
  category: "salary" | "contract" | "vesting" | "custom";
}

interface TemplateFormProps {
  formData: Omit<StreamTemplate, "id">;
  isEditing: boolean;
  onFormChange: (data: Omit<StreamTemplate, "id">) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function TemplateForm({
  formData,
  isEditing,
  onFormChange,
  onSubmit,
  onCancel,
}: TemplateFormProps) {
  return (
    <Card className="border-brand-pink/20">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Template" : "Create New Template"}</CardTitle>
        <CardDescription>
          Define a reusable template for stream creation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              placeholder="Monthly Salary"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                onFormChange({ ...formData, category: e.target.value as StreamTemplate["category"] })
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="salary">Salary</option>
              <option value="contract">Contract</option>
              <option value="vesting">Vesting</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe this template..."
            value={formData.description}
            onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (sBTC)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="5.0"
              value={formData.amount}
              onChange={(e) => onFormChange({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <select
              id="duration"
              value={formData.durationBlocks}
              onChange={(e) => {
                const blocks = parseInt(e.target.value);
                const labels: Record<number, string> = {
                  [BLOCKS_PER_WEEK]: "7 days",
                  [BLOCKS_PER_MONTH]: "30 days",
                  [BLOCKS_PER_MONTH * 3]: "90 days",
                  [BLOCKS_PER_MONTH * 6]: "180 days",
                  [BLOCKS_PER_MONTH * 12]: "365 days",
                };
                onFormChange({
                  ...formData,
                  durationBlocks: blocks,
                  durationLabel: labels[blocks] || `${blocks} blocks`,
                });
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={BLOCKS_PER_WEEK}>1 Week (~{BLOCKS_PER_WEEK} blocks)</option>
              <option value={BLOCKS_PER_MONTH}>1 Month (~{BLOCKS_PER_MONTH} blocks)</option>
              <option value={BLOCKS_PER_MONTH * 3}>3 Months (~{BLOCKS_PER_MONTH * 3} blocks)</option>
              <option value={BLOCKS_PER_MONTH * 6}>6 Months (~{BLOCKS_PER_MONTH * 6} blocks)</option>
              <option value={BLOCKS_PER_MONTH * 12}>1 Year (~{BLOCKS_PER_MONTH * 12} blocks)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            className="bg-brand-pink hover:bg-brand-pink/90"
            disabled={!formData.name || !formData.amount}
          >
            {isEditing ? "Update Template" : "Create Template"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
