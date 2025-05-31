"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EnvironmentCheck {
  status: "OK" | "WARNING" | "ERROR";
  environment: {
    NODE_ENV: string;
    isProduction: boolean;
    hasAllStripeKeys: boolean;
  };
  envCheck: {
    [key: string]: {
      exists: boolean;
      type: string;
      masked: string | null;
    };
  };
  consistencyCheck: {
    keysMatchEnvironment: boolean;
    expectedKeyType: string;
    actualKeyType: string;
    isConsistent: boolean;
  };
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export default function StripeEnvironmentPage() {
  const [envData, setEnvData] = useState<EnvironmentCheck | null>(null);
  const [loading, setLoading] = useState(true);

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/environment-check");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "環境チェックに失敗しました");
      }

      setEnvData(data.data);
    } catch (error) {
      console.error("環境チェックエラー:", error);
      toast.error("環境チェックに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "WARNING":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "ERROR":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
        return "bg-green-100 text-green-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">環境確認中...</span>
        </div>
      </div>
    );
  }

  if (!envData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              環境データを取得できませんでした
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={checkEnvironment}>再試行</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stripe 環境設定確認</h1>
        <Button onClick={checkEnvironment} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          再確認
        </Button>
      </div>

      {/* 全体ステータス */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(envData.status)}
            全体ステータス
            <Badge className={getStatusColor(envData.status)}>
              {envData.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">環境</p>
              <p className="text-lg">{envData.environment.NODE_ENV}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">本番環境</p>
              <p className="text-lg">
                {envData.environment.isProduction ? "✅ はい" : "❌ いいえ"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">必要なキー</p>
              <p className="text-lg">
                {envData.environment.hasAllStripeKeys
                  ? "✅ すべて設定済み"
                  : "❌ 不足あり"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">キー整合性</p>
              <p className="text-lg">
                {envData.consistencyCheck.isConsistent
                  ? "✅ 正常"
                  : "❌ 不整合"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 環境変数詳細 */}
      <Card>
        <CardHeader>
          <CardTitle>環境変数詳細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(envData.envCheck).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{key}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={value.exists ? "default" : "destructive"}>
                      {value.exists ? "設定済み" : "未設定"}
                    </Badge>
                    <Badge variant="outline">{value.type}</Badge>
                  </div>
                </div>
                {value.masked && (
                  <p className="text-sm text-gray-600 font-mono">
                    {value.masked}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 整合性チェック */}
      <Card>
        <CardHeader>
          <CardTitle>整合性チェック</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>期待するキータイプ</span>
              <Badge>{envData.consistencyCheck.expectedKeyType}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>実際のキータイプ</span>
              <Badge
                variant={
                  envData.consistencyCheck.isConsistent
                    ? "default"
                    : "destructive"
                }
              >
                {envData.consistencyCheck.actualKeyType}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>キー環境一致</span>
              <span>
                {envData.consistencyCheck.keysMatchEnvironment ? "✅" : "❌"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* エラー・警告 */}
      {(envData.errors.length > 0 || envData.warnings.length > 0) && (
        <div className="space-y-4">
          {envData.errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  エラー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {envData.errors.map((error, index) => (
                    <li key={index} className="text-red-700">
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {envData.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  警告
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {envData.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-700">
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 推奨事項 */}
      <Card>
        <CardHeader>
          <CardTitle>推奨事項</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2">
            {envData.recommendations.map((recommendation, index) => (
              <li key={index} className="text-gray-700">
                {recommendation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 本番環境移行ガイドリンク */}
      <Card>
        <CardHeader>
          <CardTitle>本番環境移行</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            本番環境への移行手順については、詳細なガイドをご確認ください。
          </p>
          <Button variant="outline" asChild>
            <a href="/docs/stripe-production-migration.md" target="_blank">
              移行ガイドを確認
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
