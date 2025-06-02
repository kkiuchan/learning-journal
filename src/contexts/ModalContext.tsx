"use client";

import React, { createContext, useContext, useState } from "react";

interface ModalContextType {
  isCreateUnitModalOpen: boolean;
  setIsCreateUnitModalOpen: (open: boolean) => void;
  openCreateUnitModal: () => void;
  closeCreateUnitModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isCreateUnitModalOpen, setIsCreateUnitModalOpen] = useState(false);

  const openCreateUnitModal = () => setIsCreateUnitModalOpen(true);
  const closeCreateUnitModal = () => setIsCreateUnitModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isCreateUnitModalOpen,
        setIsCreateUnitModalOpen,
        openCreateUnitModal,
        closeCreateUnitModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
