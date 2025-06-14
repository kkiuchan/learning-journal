"use client";

import { Button } from "@/components/ui/button";
import { useModalStore } from "@/contexts/ModalStore";

interface UserProfileActionsProps {
  currentUserId: string | undefined;
  profileUserId: string;
}

export function UserProfileActions({
  currentUserId,
  profileUserId,
}: UserProfileActionsProps) {
  const { openCreateUnitModal } = useModalStore();

  if (currentUserId !== profileUserId) {
    return null;
  }

  return <Button onClick={openCreateUnitModal}>新規作成</Button>;
}
