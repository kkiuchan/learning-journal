"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-red-600">エラーが発生しました</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            ページの読み込み中にエラーが発生しました。
            もう一度お試しいただくか、しばらく経ってからアクセスしてください。
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
