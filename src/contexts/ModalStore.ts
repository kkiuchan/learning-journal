import { create } from "zustand";

interface ModalState {
  isCreateUnitModalOpen: boolean;
  openCreateUnitModal: () => void;
  closeCreateUnitModal: () => void;
  setIsCreateUnitModalOpen: (open: boolean) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isCreateUnitModalOpen: false,
  openCreateUnitModal: () => set(() => ({ isCreateUnitModalOpen: true })),
  closeCreateUnitModal: () => set(() => ({ isCreateUnitModalOpen: false })),
  setIsCreateUnitModalOpen: (open: boolean) =>
    set(() => ({ isCreateUnitModalOpen: open })),
}));
