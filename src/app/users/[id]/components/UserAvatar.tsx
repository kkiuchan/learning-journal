"use client";

type UserAvatarProps = {
  imageUrl: string | null;
  userName: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export default function UserAvatar({
  imageUrl,
  userName,
  size = "md",
  className = "",
}: UserAvatarProps) {
  // サイズに基づいてクラスを設定
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <img
        src={imageUrl || "/images/default-avatar.png"}
        alt={userName || "ユーザー"}
        className="rounded-full object-cover w-full h-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/images/default-avatar.png";
        }}
      />
    </div>
  );
}
