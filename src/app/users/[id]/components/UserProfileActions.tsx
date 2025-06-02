"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/contexts/ModalContext";

interface UserProfileActionsProps {
  currentUserId: string | undefined;
  profileUserId: string;
}

export function UserProfileActions({
  currentUserId,
  profileUserId,
}: UserProfileActionsProps) {
  const { openCreateUnitModal } = useModal();

  if (currentUserId !== profileUserId) {
    return null;
  }

  return <Button onClick={openCreateUnitModal}>新規作成</Button>;
}
