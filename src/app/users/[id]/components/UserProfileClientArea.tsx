"use client";

import { ProfileEditModal } from "@/components/ProfileEditModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Skill {
  id: number;
  name: string;
}

interface Interest {
  id: number;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
  selfIntroduction: string | null;
  age: number | null;
  ageVisible: boolean;
  skills: Skill[];
  interests: Interest[];
}

export function UserProfileClientArea({
  user,
  currentUserId,
}: {
  user: User;
  currentUserId: string | undefined;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="flex-1 w-full text-center sm:text-left">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          {user.name || "名前未設定"}
        </h1>
        {currentUserId === user.id && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
            >
              プロフィールを編集
            </Button>
            <ProfileEditModal open={modalOpen} onOpenChange={setModalOpen} />
          </>
        )}
      </div>
      {user.selfIntroduction && (
        <p className="text-sm sm:text-base text-muted-foreground mb-4">
          {user.selfIntroduction}
        </p>
      )}
      {user.ageVisible && user.age && (
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            年齢:
          </span>
          <span className="text-xs sm:text-sm">{user.age}歳</span>
        </div>
      )}
      {user.skills?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold mb-2">スキル</h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2">
            {user.skills.map((skill: Skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="text-xs sm:text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
              >
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {user.interests?.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-2">
            興味・関心
          </h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2">
            {user.interests.map((interest: Interest) => (
              <Badge
                key={interest.id}
                variant="outline"
                className="text-xs sm:text-sm bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              >
                {interest.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
