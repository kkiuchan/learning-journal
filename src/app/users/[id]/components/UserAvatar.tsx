"use client";

type UserAvatarProps = {
  imageUrl: string | null;
  userName: string | null;
};

export default function UserAvatar({ imageUrl, userName }: UserAvatarProps) {
  return (
    <img
      src={imageUrl || "/images/default-avatar.png"}
      alt={userName || "ユーザー"}
      className="w-24 h-24 rounded-full object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "/images/default-avatar.png";
      }}
    />
  );
}
