import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  test("基本的なレンダリング", () => {
    render(<Badge>テストバッジ</Badge>);

    const badge = screen.getByText("テストバッジ");
    expect(badge).toBeInTheDocument();
  });

  test("異なるvariantが適用される", () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);

    let badge = screen.getByText("Secondary");
    expect(badge.className).toContain("bg-secondary");

    rerender(<Badge variant="destructive">Destructive</Badge>);
    badge = screen.getByText("Destructive");
    expect(badge.className).toContain("bg-destructive");

    rerender(<Badge variant="outline">Outline</Badge>);
    badge = screen.getByText("Outline");
    expect(badge.className).toContain("text-foreground");
  });

  test("カスタムクラスが適用される", () => {
    render(<Badge className="custom-class">Custom</Badge>);

    const badge = screen.getByText("Custom");
    expect(badge.className).toContain("custom-class");
  });

  test("HTML属性が適用される", () => {
    render(<Badge title="バッジタイトル">属性テスト</Badge>);

    const badge = screen.getByText("属性テスト");
    expect(badge).toHaveAttribute("title", "バッジタイトル");
  });
});
