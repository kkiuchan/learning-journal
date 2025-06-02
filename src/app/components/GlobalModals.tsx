"use client";

import { useModal } from "@/contexts/ModalContext";
import { CreateUnitModal } from "../units/components/CreateUnitModal";

export function GlobalModals() {
  const { isCreateUnitModalOpen, setIsCreateUnitModalOpen } = useModal();

  const handleCreateSuccess = () => {
    // CreateUnitModalで画面遷移するため、ここでは特に何もしない
  };

  return (
    <>
      <CreateUnitModal
        open={isCreateUnitModalOpen}
        onOpenChange={setIsCreateUnitModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
