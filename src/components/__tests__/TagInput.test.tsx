import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { TagInput } from "../TagInput";

describe("TagInput", () => {
  const mockSetTags = jest.fn();

  beforeEach(() => {
    mockSetTags.mockClear();
  });

  test("基本的なレンダリング", () => {
    render(
      <TagInput tags={[]} setTags={mockSetTags} placeholder="タグを入力" />
    );

    const input = screen.getByPlaceholderText("タグを入力");
    expect(input).toBeInTheDocument();
  });

  test("既存のタグが表示される", () => {
    render(<TagInput tags={["React", "TypeScript"]} setTags={mockSetTags} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  test("Enterキーでタグが追加される（小文字に変換）", () => {
    render(<TagInput tags={["react"]} setTags={mockSetTags} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "TypeScript" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSetTags).toHaveBeenCalledWith(["react", "typescript"]);
  });

  test("空の値ではタグが追加されない", () => {
    render(<TagInput tags={["React"]} setTags={mockSetTags} />);

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSetTags).not.toHaveBeenCalled();
  });

  test("重複するタグは追加されない", () => {
    render(<TagInput tags={["react"]} setTags={mockSetTags} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "React" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSetTags).not.toHaveBeenCalled();
  });

  test("Xボタンでタグが削除される", () => {
    render(<TagInput tags={["React", "TypeScript"]} setTags={mockSetTags} />);

    // React タグのXボタンをクリック
    const deleteButtons = screen.getAllByRole("button");
    fireEvent.click(deleteButtons[0]);

    expect(mockSetTags).toHaveBeenCalledWith(["TypeScript"]);
  });

  test("最大タグ数制限が機能する（input非表示）", () => {
    render(
      <TagInput
        tags={["react", "typescript"]}
        setTags={mockSetTags}
        maxTags={2}
      />
    );

    // 最大タグ数に達するとinput要素は表示されない
    const inputs = screen.queryAllByRole("textbox");
    expect(inputs).toHaveLength(0);
  });

  test("無効状態では入力できない", () => {
    render(<TagInput tags={["react"]} setTags={mockSetTags} disabled />);

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });
});
