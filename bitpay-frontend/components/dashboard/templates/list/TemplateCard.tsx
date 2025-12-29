"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Clock, Calendar, Copy, Edit, Trash2 } from "lucide-react";

interface StreamTemplate {
  id: string;
  name: string;
  description: string;
  amount: string;
  durationBlocks: number;
  durationLabel: string;
  category: "salary" | "contract" | "vesting" | "custom";
}

interface TemplateCardProps {
  template: StreamTemplate;
  onUse: (template: StreamTemplate) => void;
  onEdit?: (template: StreamTemplate) => void;
  onDelete?: (id: string) => void;
}

const getCategoryColor = (category: StreamTemplate["category"]) => {
  switch (category) {
    case "salary":
      return "bg-blue-500";
    case "contract":
      return "bg-green-500";
    case "vesting":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

export function TemplateCard({ template, onUse, onEdit, onDelete }: TemplateCardProps) {
  const isCustom = template.id.startsWith("custom-");

  return (
    <Card className="hover:border-brand-pink/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-brand-pink" />
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </div>
            <Badge className={`${getCategoryColor(template.category)} text-white`}>
              {template.category}
            </Badge>
          </div>
        </div>
        <CardDescription className="mt-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Amount
            </span>
            <span className="font-semibold">{template.amount} sBTC</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Duration
            </span>
            <span className="font-semibold">{template.durationLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Blocks
            </span>
            <span className="font-semibold">{template.durationBlocks.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onUse(template)}
            className="flex-1 bg-brand-teal hover:bg-brand-teal/90"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-1" />
            Use Template
          </Button>
          {isCustom && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(template)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete?.(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
