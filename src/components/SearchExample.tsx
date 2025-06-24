import { useMemo, useState, useTransition } from "react";

interface Item {
  id: number;
  name: string;
  description: string;
}

const MOCK_DATA: Item[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  description: `Description for item ${i}`,
}));

export function SearchExample() {
  const [query, setQuery] = useState("");
  const [filteredQuery, setFilteredQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // 重い計算処理（10,000件のフィルタリング）
  const filteredItems = useMemo(() => {
    if (!filteredQuery) return MOCK_DATA.slice(0, 100);

    return MOCK_DATA.filter(
      (item) =>
        item.name.toLowerCase().includes(filteredQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(filteredQuery.toLowerCase())
    );
  }, [filteredQuery]);

  // 入力ハンドラー
  const handleSearch = (newQuery: string) => {
    // 即座にUI更新（緊急度高）
    setQuery(newQuery);

    // 重い処理は遅延可能としてマーク（緊急度低）
    startTransition(() => {
      setFilteredQuery(newQuery);
    });
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search items..."
          className="w-full p-2 border rounded"
        />

        {/* ローディング状態の表示 */}
        {isPending && <div className="mt-2 text-blue-600">🔄 検索中...</div>}
      </div>

      {/* 結果表示 */}
      <div
        className={`transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
      >
        <p className="mb-2">{filteredItems.length}件の結果が見つかりました</p>

        <div className="space-y-2">
          {filteredItems.slice(0, 50).map((item) => (
            <div key={item.id} className="p-2 border rounded">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
