"use client";

import { CreateUnitModal } from "@/app/units/components/CreateUnitModal";
import { useModalStore } from "@/stores/ModalStore";

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
