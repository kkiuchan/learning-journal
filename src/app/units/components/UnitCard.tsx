import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import { UnitDTO } from "@/types/unit";
import { translateUnitStatus } from "@/utils/i18n";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { FileText, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";

interface UnitCardProps {
  unit: UnitDTO;
  onLike?: (unitId: number) => void;
  showMenu?: boolean;
}

export function UnitCard({ unit, onLike, showMenu = true }: UnitCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base sm:text-xl line-clamp-2 flex-1">
            <Link href={`/units/${unit.id}`} className="hover:underline">
              {unit.title}
            </Link>
          </CardTitle>
          <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2">
            <Badge
              variant={
                unit.status === "COMPLETED"
                  ? "default"
                  : unit.status === "IN_PROGRESS"
                    ? "secondary"
                    : "outline"
              }
              className={`
                text-[10px] sm:text-xs
                px-1 py-0
                rounded-[3px]
                ${
                  unit.status === "COMPLETED"
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : unit.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100"
                }
                whitespace-nowrap
                min-w-0
                h-5
                leading-none
              `}
            >
              {translateUnitStatus(unit.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-3 sm:px-6">
        <div className="space-y-2 flex-1">
          {unit.learningGoal && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {unit.learningGoal}
            </p>
          )}
          <div className="flex flex-wrap gap-1">
            {unit.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs sm:text-sm bg-gray-100"
              >
                {tag.name}
              </Badge>
            ))}
            {unit.tags && unit.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs sm:text-sm bg-gray-100"
              >
                +{unit.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-auto">
            <div className="line-clamp-1">
              {unit.startDate && (
                <span>
                  開始:{" "}
                  {format(new Date(unit.startDate), "yyyy/MM/dd", {
                    locale: ja,
                  })}
                </span>
              )}
              {unit.endDate && (
                <span className="ml-2">
                  終了:{" "}
                  {format(new Date(unit.endDate), "yyyy/MM/dd", {
                    locale: ja,
                  })}
                </span>
              )}
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-gray-500">
                <FileText className="h-4 w-4" />
                <span>{unit._count?.logs || 0}</span>
              </div>
              {onLike && (
                <button
                  onClick={() => onLike(unit.id)}
                  className={`flex items-center gap-1 ${
                    unit.isLiked ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  <Heart
                    className={
                      unit.isLiked ? "h-4 w-4 fill-current" : "h-4 w-4"
                    }
                  />
                  <span>{unit._count?.unitLikes || 0}</span>
                </button>
              )}
              <div className="flex items-center gap-1 text-gray-500">
                <MessageCircle className="h-4 w-4" />
                <span>{unit._count?.comments || 0}</span>
              </div>
            </div>
          </div>
        </div>
        {unit.user && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2">
            <UserAvatar
              imageUrl={unit.user.image}
              userName={unit.user.name}
              size="sm"
            />
            <span className="text-xs sm:text-sm text-gray-600">
              {unit.user.name || "ユーザー"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
