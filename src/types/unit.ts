export type Unit = {
  id: number;
  userId: string;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: "計画中" | "進行中" | "完了";
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  tags: {
    id: number;
    name: string;
  }[];
  _count: {
    logs: number;
    unitLikes: number;
    comments: number;
    totalLearningTime: number;
  };
  isLiked: boolean;
};
