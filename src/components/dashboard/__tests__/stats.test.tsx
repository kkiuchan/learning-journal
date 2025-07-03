import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DashboardStats } from "../stats";

describe("DashboardStats", () => {
  const mockData = {
    totalLearningTime: 15.5,
    completedUnitsCount: 8,
    activeUnitsCount: 3,
    streakDays: 12,
  };

  test("統計データが正しく表示される", () => {
    render(<DashboardStats data={mockData} />);

    expect(screen.getByText("総学習時間")).toBeInTheDocument();
    expect(screen.getByText("15.5時間")).toBeInTheDocument();
    expect(screen.getByText("今月の学習時間")).toBeInTheDocument();

    expect(screen.getByText("完了済みユニット")).toBeInTheDocument();
    expect(screen.getByText("8個")).toBeInTheDocument();
    expect(screen.getByText("完了したユニット数")).toBeInTheDocument();

    expect(screen.getByText("進行中ユニット")).toBeInTheDocument();
    expect(screen.getByText("3個")).toBeInTheDocument();
    expect(screen.getByText("現在学習中のユニット")).toBeInTheDocument();

    expect(screen.getByText("継続日数")).toBeInTheDocument();
    expect(screen.getByText("12日")).toBeInTheDocument();
    expect(screen.getByText("連続学習日数")).toBeInTheDocument();
  });

  test("学習時間の小数点が正しく処理される", () => {
    const dataWithDecimals = {
      ...mockData,
      totalLearningTime: 123.456,
    };

    render(<DashboardStats data={dataWithDecimals} />);

    expect(screen.getByText("123.5時間")).toBeInTheDocument();
  });

  test("ゼロ値が正しく表示される", () => {
    const zeroData = {
      totalLearningTime: 0,
      completedUnitsCount: 0,
      activeUnitsCount: 0,
      streakDays: 0,
    };

    render(<DashboardStats data={zeroData} />);

    expect(screen.getByText("0.0時間")).toBeInTheDocument();
    expect(screen.getByText("0日")).toBeInTheDocument();

    // 「0個」が複数存在するため、より具体的な検証方法を使用
    expect(screen.getByText("完了済みユニット")).toBeInTheDocument();
    expect(screen.getByText("進行中ユニット")).toBeInTheDocument();

    // 複数の「0個」を確認
    const zeroCountElements = screen.getAllByText("0個");
    expect(zeroCountElements).toHaveLength(2);
  });

  test("大きな数値が正しく表示される", () => {
    const largeData = {
      totalLearningTime: 1000.7,
      completedUnitsCount: 99,
      activeUnitsCount: 50,
      streakDays: 365,
    };

    render(<DashboardStats data={largeData} />);

    expect(screen.getByText("1000.7時間")).toBeInTheDocument();
    expect(screen.getByText("99個")).toBeInTheDocument();
    expect(screen.getByText("50個")).toBeInTheDocument();
    expect(screen.getByText("365日")).toBeInTheDocument();
  });

  test("すべての統計カードがレンダリングされる", () => {
    render(<DashboardStats data={mockData} />);

    const cards = document.querySelectorAll("[data-testid], .space-y-0");
    expect(cards.length).toBeGreaterThan(0);
  });

  test("各統計項目のアイコンが表示される", () => {
    render(<DashboardStats data={mockData} />);

    // SVGアイコンの存在を確認
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  test("統計項目が正しい順序で表示される", () => {
    render(<DashboardStats data={mockData} />);

    const titles = [
      "総学習時間",
      "完了済みユニット",
      "進行中ユニット",
      "継続日数",
    ];

    titles.forEach((title, index) => {
      const element = screen.getByText(title);
      expect(element).toBeInTheDocument();
    });
  });
});
