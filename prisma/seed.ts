// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // サンプルユーザー作成（メール認証とサブスクリプション情報付き）
  const user1 = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@example.com",
      hashedPassword: "hashedpassword", // ※実際はハッシュ化した値を使います
      primaryAuthMethod: "email",
      subscriptionStatus: "active",
      subscriptionPlan: "pro",
      subscriptionStart: new Date(),
      subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
    },
  });

  // サンプル外部認証情報の作成（例: Google）
  await prisma.userProvider.create({
    data: {
      userId: user1.id,
      provider: "google",
      providerId: "google-alice-id",
      accessToken: "dummy-access-token",
      refreshToken: "dummy-refresh-token",
    },
  });

  // サンプルユニットの作成
  const unit1 = await prisma.unit.create({
    data: {
      userId: user1.id,
      title: "Learn Prisma",
      learningGoal: "Understand how to use Prisma for database management",
      preLearningState: "Beginner",
      reflection: "Good progress, but more practice needed.",
      nextAction: "Explore advanced queries",
      status: "完了", // 例: 完了
    },
  });

  // サンプルログの作成
  const log1 = await prisma.log.create({
    data: {
      unitId: unit1.id,
      userId: user1.id,
      title: "Initial Setup",
      learningTime: 60, // 60分
      note: "# Welcome to Prisma\nThis is a sample log note in markdown.",
      logDate: new Date(),
    },
  });

  // サンプルタグの作成
  const tag1 = await prisma.tag.create({
    data: { name: "database" },
  });

  // ユニットにタグを関連付け（中間テーブル: UnitTag）
  await prisma.unitTag.create({
    data: {
      unitId: unit1.id,
      tagId: tag1.id,
    },
  });

  // ログにタグを関連付け（中間テーブル: LogTag）
  await prisma.logTag.create({
    data: {
      logId: log1.id,
      tagId: tag1.id,
    },
  });

  // サンプルコメントの作成
  await prisma.comment.create({
    data: {
      unitId: unit1.id,
      userId: user1.id,
      comment: "Great progress on learning Prisma!",
    },
  });

  // サンプルいいねの作成（自分でいいねする例）
  await prisma.unitLike.create({
    data: {
      userId: user1.id,
      unitId: unit1.id,
    },
  });

  // サンプルスキルと関心の登録（UserSkill, UserInterest）
  await prisma.userSkill.create({
    data: {
      userId: user1.id,
      tagId: tag1.id,
    },
  });

  await prisma.userInterest.create({
    data: {
      userId: user1.id,
      tagId: tag1.id,
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
