import { create } from "zustand";

interface MenuState {
  openMenuId: number | null;
  setOpenMenuId: (id: number | null) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  openMenuId: null,
  setOpenMenuId: (id: number | null) => set(() => ({ openMenuId: id })),
}));
