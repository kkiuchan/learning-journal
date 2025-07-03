import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../card";

describe("Card", () => {
  test("基本的なカードがレンダリングされる", () => {
    render(
      <Card>
        <CardContent>テストコンテンツ</CardContent>
      </Card>
    );

    const content = screen.getByText("テストコンテンツ");
    expect(content).toBeInTheDocument();
  });

  test("完全なカード構造がレンダリングされる", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>タイトル</CardTitle>
          <CardDescription>説明文</CardDescription>
        </CardHeader>
        <CardContent>メインコンテンツ</CardContent>
        <CardFooter>フッター</CardFooter>
      </Card>
    );

    expect(screen.getByText("タイトル")).toBeInTheDocument();
    expect(screen.getByText("説明文")).toBeInTheDocument();
    expect(screen.getByText("メインコンテンツ")).toBeInTheDocument();
    expect(screen.getByText("フッター")).toBeInTheDocument();
  });

  test("カスタムクラスが適用される", () => {
    const { container } = render(
      <Card className="custom-card">
        <CardContent>テスト</CardContent>
      </Card>
    );

    // Card要素を直接取得（最初のdiv要素）
    const card = container.firstChild as HTMLElement;
    expect(card?.className).toContain("custom-card");
  });
});
