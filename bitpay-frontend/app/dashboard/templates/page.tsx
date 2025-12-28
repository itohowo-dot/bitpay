"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BLOCKS_PER_MONTH, BLOCKS_PER_WEEK } from "@/lib/contracts/config";
import { TemplatesHeader } from "@/components/dashboard/templates/TemplatesHeader";
import { TemplateForm } from "@/components/dashboard/templates/form/TemplateForm";
import { TemplateCard } from "@/components/dashboard/templates/list/TemplateCard";
import { EmptyTemplates } from "@/components/dashboard/templates/list/EmptyTemplates";
import { TemplatesInfo } from "@/components/dashboard/templates/TemplatesInfo";
import { useAuth } from "@/hooks/use-auth";

interface StreamTemplate {
  _id?: string;
  id: string;
  name: string;
  description: string;
  amount: string;
  durationBlocks: number;
  durationLabel: string;
  category: "salary" | "contract" | "vesting" | "custom";
  isDefault?: boolean;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState<StreamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    durationBlocks: BLOCKS_PER_MONTH,
    durationLabel: "30 days",
    category: "custom" as StreamTemplate["category"],
  });

  // Fetch templates on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/templates", {
        credentials: "include", // Send httpOnly cookies
      });

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      
      // Map MongoDB _id to id for consistency with existing components
      const mappedTemplates = data.templates.map((t: any) => ({
        ...t,
        id: t._id || t.id,
      }));

      setTemplates(mappedTemplates);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.amount) return;

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send httpOnly cookies
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create template");
      }

      const data = await response.json();
      
      // Add new template to list
      const newTemplate = {
        ...data.template,
        id: data.template._id || data.template.id,
      };
      
      setTemplates([...templates, newTemplate]);
      resetForm();
    } catch (err) {
      console.error("Error creating template:", err);
      alert("Failed to create template");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingId || !formData.name || !formData.amount) return;

    try {
      const response = await fetch(`/api/templates/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send httpOnly cookies
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update template");
      }

      const data = await response.json();
      
      // Update template in list
      const updatedTemplate = {
        ...data.template,
        id: data.template._id || data.template.id,
      };
      
      setTemplates(
        templates.map((t) => (t.id === editingId ? updatedTemplate : t))
      );
      resetForm();
    } catch (err) {
      console.error("Error updating template:", err);
      alert("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        credentials: "include", // Send httpOnly cookies
      });

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template");
    }
  };

  const handleEditTemplate = (template: StreamTemplate) => {
    // Prevent editing default templates
    if (template.isDefault) {
      alert("Default templates cannot be edited. Create a custom template instead.");
      return;
    }

    setFormData({
      name: template.name,
      description: template.description,
      amount: template.amount,
      durationBlocks: template.durationBlocks,
      durationLabel: template.durationLabel,
      category: template.category,
    });
    setEditingId(template.id);
    setIsCreating(true);
  };

  const handleUseTemplate = (template: StreamTemplate) => {
    // Store template data in localStorage for stream creation page
    if (typeof window !== "undefined") {
      localStorage.setItem("bitpay-stream-template-data", JSON.stringify(template));
    }
    router.push("/dashboard/streams/create");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      amount: "",
      durationBlocks: BLOCKS_PER_MONTH,
      durationLabel: "30 days",
      category: "custom",
    });
    setIsCreating(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={fetchTemplates}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TemplatesHeader
        isCreating={isCreating}
        onToggleCreate={() => setIsCreating(!isCreating)}
      />

      {isCreating && (
        <TemplateForm
          formData={formData}
          isEditing={!!editingId}
          onFormChange={setFormData}
          onSubmit={editingId ? handleUpdateTemplate : handleCreateTemplate}
          onCancel={resetForm}
        />
      )}

      {templates.length === 0 ? (
        <EmptyTemplates onCreateClick={() => setIsCreating(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUseTemplate}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}

      <TemplatesInfo />
    </div>
  );
}
