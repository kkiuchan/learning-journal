import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../button";

describe("Button", () => {
  describe("基本的なレンダリング", () => {
    test("デフォルトのボタンが正常にレンダリングされる", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    test("異なるvariantが正しく適用される", () => {
      const { rerender } = render(
        <Button variant="destructive">Delete</Button>
      );

      let button = screen.getByRole("button");
      expect(button).toHaveClass(
        "bg-destructive",
        "text-destructive-foreground"
      );

      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveClass("border", "border-input");

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");

      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");

      rerender(<Button variant="link">Link</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary", "underline-offset-4");
    });

    test("異なるsizeが正しく適用される", () => {
      const { rerender } = render(<Button size="sm">Small</Button>);

      let button = screen.getByRole("button");
      expect(button).toHaveClass("h-8", "rounded-md", "px-3", "text-xs");

      rerender(<Button size="lg">Large</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveClass("h-10", "rounded-md", "px-8");

      rerender(<Button size="icon">Icon</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveClass("h-9", "w-9");
    });
  });

  describe("Props とカスタマイズ", () => {
    test("カスタムclassNameが適用される", () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });

    test("disabled状態が正しく動作する", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none",
        "disabled:opacity-50"
      );
    });

    test("HTML button属性が正しく渡される", () => {
      render(
        <Button type="submit" title="Submit button" aria-label="Submit form">
          Submit
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toHaveAttribute("title", "Submit button");
      expect(button).toHaveAttribute("aria-label", "Submit form");
    });
  });

  describe("ユーザーインタラクション", () => {
    test("クリックイベントが正常に動作する", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test("disabled状態ではクリックが無効化される", () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    test("フォーカスが正常に動作する", () => {
      render(<Button>Keyboard</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });
  });

  describe("asChild機能", () => {
    test("asChildがtrueの場合、子要素が直接レンダリングされる", () => {
      render(
        <Button asChild>
          <a href="/test">Link as Button</a>
        </Button>
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveClass("bg-primary", "text-primary-foreground");
    });
  });

  describe("アクセシビリティ", () => {
    test("適切なrole属性が設定される", () => {
      render(<Button>Accessible Button</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    test("フォーカス可能である", () => {
      render(<Button>Focusable</Button>);

      const button = screen.getByRole("button");
      button.focus();

      expect(button).toHaveFocus();
    });

    test("適切なaria属性が設定される", () => {
      render(
        <Button aria-pressed="true" aria-describedby="description">
          Toggle Button
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).toHaveAttribute("aria-describedby", "description");
    });
  });

  describe("variant combinations", () => {
    test("全てのvariantとsizeの組み合わせが動作する", () => {
      const variants = [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ] as const;
      const sizes = ["default", "sm", "lg", "icon"] as const;

      variants.forEach((variant) => {
        sizes.forEach((size) => {
          const { unmount } = render(
            <Button variant={variant} size={size}>
              {variant}-{size}
            </Button>
          );

          const button = screen.getByRole("button");
          expect(button).toBeInTheDocument();

          unmount();
        });
      });
    });
  });

  describe("アイコンとの組み合わせ", () => {
    test("アイコンが含まれたボタンが正常に動作する", () => {
      const TestIcon = () => <svg data-testid="test-icon" />;

      render(
        <Button>
          <TestIcon />
          Icon Button
        </Button>
      );

      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
      expect(screen.getByText("Icon Button")).toBeInTheDocument();
    });
  });
});
