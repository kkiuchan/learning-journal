"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import WizardLogForm from "./WizardLogForm";

interface Resource {
  id?: number;
  resourceType: string | null;
  resourceLink: string;
  description: string | null;
  fileName?: string;
  filePath?: string;
}

interface CreateLogFormValues {
  title: string;
  learningTime: number;
  note: string;
  logDate: string;
  tags: string[];
  resources: Resource[];
  effectScore: number;
  effectType: string;
}

interface CreateLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  onSubmit: (form: CreateLogFormValues) => Promise<void>;
  formData?: {
    title: string;
    learningTime: number;
    note: string;
    logDate: string;
    effectScore: number;
    effectType: string;
    tags: string[];
    resources: Resource[];
    currentStep: number;
  };
  onFormDataChange?: (data: {
    title: string;
    learningTime: number;
    note: string;
    logDate: string;
    effectScore: number;
    effectType: string;
    tags: string[];
    resources: Resource[];
    currentStep: number;
  }) => void;
}

export function CreateLogModal({
  open,
  onOpenChange,
  unitId,
  onSubmit,
  formData,
  onFormDataChange,
}: CreateLogModalProps) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <VisuallyHidden>
          <DialogTitle>学習ログを作成</DialogTitle>
        </VisuallyHidden>
        <WizardLogForm
          unitId={unitId}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          onSubmit={onSubmit}
          formData={formData}
          onFormDataChange={onFormDataChange}
        />
      </DialogContent>
    </Dialog>
  );
}
