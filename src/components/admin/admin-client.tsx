"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/stores/SupabaseAuthStore";
import { Crown, Search, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
}

interface SearchResult {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  query: string;
}

export function AdminClient() {
  const { session } = useAuthStore();
  const accessToken = session?.access_token;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("検索キーワードを入力してください");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "検索に失敗しました");
      }

      setSearchResult(data.data);
    } catch (error) {
      console.error("ユーザー検索エラー:", error);
      toast.error(
        error instanceof Error ? error.message : "検索に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGrantLifetimePro = async (userId: string, userEmail: string) => {
    const reason = prompt(
      `${userEmail} にライフタイムプロプランを付与します。\n理由を入力してください（任意）:`
    );

    if (reason === null) return; // キャンセルされた場合

    setOperationLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/lifetime-pro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "付与に失敗しました");
      }

      toast.success("ライフタイムプロプランを付与しました");

      // 検索結果を更新
      if (searchResult) {
        setSearchResult({
          ...searchResult,
          users: searchResult.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  subscriptionStatus: "lifetime",
                  subscriptionPlan: "pro",
                  subscriptionStart: new Date().toISOString(),
                  subscriptionEnd: "2099-12-31T23:59:59.999Z",
                }
              : user
          ),
        });
      }
    } catch (error) {
      console.error("ライフタイムプロプラン付与エラー:", error);
      toast.error(
        error instanceof Error ? error.message : "付与に失敗しました"
      );
    } finally {
      setOperationLoading(null);
    }
  };

  const handleRevokeLifetimePro = async (userId: string, userEmail: string) => {
    const reason = prompt(
      `${userEmail} のライフタイムプロプランを取り消します。\n理由を入力してください（任意）:`
    );

    if (reason === null) return; // キャンセルされた場合

    const confirmed = confirm(
      `本当に ${userEmail} のライフタイムプロプランを取り消しますか？`
    );

    if (!confirmed) return;

    setOperationLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/lifetime-pro`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "取り消しに失敗しました");
      }

      toast.success("ライフタイムプロプランを取り消しました");

      // 検索結果を更新
      if (searchResult) {
        setSearchResult({
          ...searchResult,
          users: searchResult.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  subscriptionStatus: null,
                  subscriptionPlan: null,
                  subscriptionStart: null,
                  subscriptionEnd: null,
                }
              : user
          ),
        });
      }
    } catch (error) {
      console.error("ライフタイムプロプラン取り消しエラー:", error);
      toast.error(
        error instanceof Error ? error.message : "取り消しに失敗しました"
      );
    } finally {
      setOperationLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const getStatusBadge = (user: User) => {
    if (user.subscriptionStatus === "lifetime") {
      return (
        <Badge className="bg-purple-500 hover:bg-purple-600">
          <Crown className="w-3 h-3 mr-1" />
          ライフタイムプロ
        </Badge>
      );
    }

    if (user.subscriptionStatus === "active") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">プロプラン</Badge>
      );
    }

    if (user.subscriptionStatus === "trialing") {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">トライアル</Badge>
      );
    }

    return <Badge variant="outline">無料プラン</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 検索セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            ユーザー検索
          </CardTitle>
          <CardDescription>
            メールアドレスまたは名前でユーザーを検索してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">検索キーワード</Label>
              <Input
                id="search"
                placeholder="メールアドレスまたは名前"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    検索中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    検索
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 検索結果 */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              検索結果 ({searchResult.pagination.total}件)
            </CardTitle>
            {searchResult.query && (
              <CardDescription>
                「{searchResult.query}」の検索結果
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {searchResult.users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>プラン</TableHead>
                    <TableHead>登録日</TableHead>
                    <TableHead>ライフタイムプロ情報</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResult.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.name || "名前未設定"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        {user.subscriptionStatus === "lifetime" ? (
                          <div className="text-sm">
                            <div>
                              付与日: {formatDate(user.subscriptionStart)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.subscriptionStatus === "lifetime" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleRevokeLifetimePro(user.id, user.email)
                              }
                              disabled={operationLoading === user.id}
                            >
                              {operationLoading === user.id ? (
                                <>
                                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                                  処理中...
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  取り消し
                                </>
                              )}
                            </Button>
                          ) : (
                            <>
                              {/* プロプラン（有料・トライアル）使用中の場合は付与不可 */}
                              {(user.subscriptionStatus === "active" ||
                                user.subscriptionStatus === "trialing") &&
                              user.subscriptionPlan === "pro" ? (
                                <div className="text-xs text-muted-foreground">
                                  <div className="text-orange-600 font-medium">
                                    {user.subscriptionStatus === "trialing"
                                      ? "トライアル中"
                                      : "プロプラン使用中"}
                                  </div>
                                  <div>永年プロプラン付与不可</div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleGrantLifetimePro(user.id, user.email)
                                  }
                                  disabled={operationLoading === user.id}
                                >
                                  {operationLoading === user.id ? (
                                    <>
                                      <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                                      処理中...
                                    </>
                                  ) : (
                                    <>
                                      <Crown className="w-3 h-3 mr-1" />
                                      付与
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                検索結果が見つかりませんでした
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
