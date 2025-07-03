import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Loading, LoadingSpinner } from "../loading";

describe("Loading", () => {
  test("基本的なローディングスピナーが表示される", () => {
    render(<Loading />);

    const spinner = document.querySelector("svg");
    expect(spinner).toBeTruthy();
    expect(spinner?.getAttribute("class")).toContain("animate-spin");
  });

  test("カスタムテキストが表示される", () => {
    render(<Loading text="データを取得中..." />);

    const loading = screen.getByText("データを取得中...");
    expect(loading).toBeInTheDocument();
  });

  test("異なるサイズが適用される", () => {
    const { rerender } = render(<Loading size="sm" />);

    let spinner = document.querySelector("svg");
    expect(spinner?.getAttribute("class")).toContain("w-4 h-4");

    rerender(<Loading size="lg" />);
    spinner = document.querySelector("svg");
    expect(spinner?.getAttribute("class")).toContain("w-8 h-8");
  });

  test("フルページローディングが適用される", () => {
    render(<Loading fullPage />);

    const container = document.querySelector("div[class*='fixed']");
    expect(container).toBeTruthy();
    expect(container?.getAttribute("class")).toContain("fixed");
  });
});

describe("LoadingSpinner", () => {
  test("基本的なスピナーが表示される", () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector("svg");
    expect(spinner).toBeTruthy();
  });

  test("異なるサイズが適用される", () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);

    let spinner = document.querySelector("svg");
    expect(spinner?.getAttribute("class")).toContain("w-4 h-4");

    rerender(<LoadingSpinner size="lg" />);
    spinner = document.querySelector("svg");
    expect(spinner?.getAttribute("class")).toContain("w-8 h-8");
  });

  test("カスタムクラスが適用される", () => {
    render(<LoadingSpinner className="custom-spinner" />);

    const spinner = document.querySelector("svg");
    expect(spinner?.getAttribute("class")).toContain("custom-spinner");
  });
});
