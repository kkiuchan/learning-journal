import { ProfileForm } from "@/app/settings/profile/components/ProfileForm";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProfileEditModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen min-h-[200px] overflow-y-auto">
        <DialogTitle>プロフィール編集</DialogTitle>
        <ProfileForm />
        <DialogClose asChild>
          <button className="mt-4 btn">閉じる</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
