"use client";

import { useModalStore } from "@/contexts/ModalStore";
import { CreateUnitModal } from "../units/components/CreateUnitModal";

export function GlobalModals() {
  const { isCreateUnitModalOpen, setIsCreateUnitModalOpen } = useModalStore();

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
