const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixProductionCustomers() {
  console.log("🔧 本番環境Stripe Customer ID修正開始...");

  try {
    // テスト環境のCustomer IDを持つユーザーを検索
    const users = await prisma.user.findMany({
      where: {
        stripeCustomerId: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        subscriptionStatus: true,
      },
    });

    console.log(`📊 対象ユーザー数: ${users.length}`);

    for (const user of users) {
      console.log(`👤 ユーザー: ${user.email}`);
      console.log(`   Customer ID: ${user.stripeCustomerId}`);
      console.log(`   Status: ${user.subscriptionStatus}`);

      // Customer IDをクリアしてサブスクリプション情報もリセット
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCustomerId: null,
          subscriptionStatus: "free",
          subscriptionPlan: "free",
          subscriptionStart: null,
          subscriptionEnd: null,
          trialEnd: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });

      console.log(`   ✅ リセット完了`);
    }

    console.log("🎉 全ユーザーの修正完了");
    console.log(
      "📝 次回のサブスクリプション作成時に新しいCustomerが自動作成されます"
    );
  } catch (error) {
    console.error("❌ エラー:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixProductionCustomers();
}

module.exports = { fixProductionCustomers };
