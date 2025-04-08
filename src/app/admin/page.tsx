"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, User } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalUsers: number;
  totalUnits: number;
  totalLogs: number;
  totalErrors: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalUnits: 0,
    totalLogs: 0,
    totalErrors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error("統計情報の取得に失敗しました");
        }

        const data = await response.json();
        setStats(data.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "予期せぬエラーが発生しました"
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">管理ダッシュボード</h1>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center">
            <div className="mr-4 bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">ユーザー数</div>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center">
            <div className="mr-4 bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">ユニット数</div>
              <div className="text-2xl font-bold">{stats.totalUnits}</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center">
            <div className="mr-4 bg-purple-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">学習ログ数</div>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center">
            <div className="mr-4 bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">エラー数</div>
              <div className="text-2xl font-bold">{stats.totalErrors}</div>
            </div>
          </Card>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">最近の活動</h2>
        <Card className="p-6">
          <p className="text-center text-gray-500">現在開発中の機能です...</p>
        </Card>
      </div>
    </div>
  );
}
