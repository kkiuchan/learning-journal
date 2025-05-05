import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  imageUrl: string | null;
  userName: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: {
    container: "w-8 h-8",
    image: 32,
  },
  md: {
    container: "w-10 h-10",
    image: 40,
  },
  lg: {
    container: "w-12 h-12",
    image: 48,
  },
};

export default function UserAvatar({
  imageUrl,
  userName,
  size = "md",
  className,
}: UserAvatarProps) {
  const { container, image } = sizeMap[size];
  const defaultImage = "/images/default-avatar.png";

  return (
    <div
      className={cn(
        container,
        "relative rounded-full overflow-hidden bg-muted",
        className
      )}
    >
      <Image
        src={imageUrl || defaultImage}
        alt={userName || "ユーザー"}
        width={image}
        height={image}
        className="object-cover"
        priority={size === "lg"}
      />
    </div>
  );
}
