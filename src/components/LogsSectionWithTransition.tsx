import { useMenuToggle } from "@/hooks/useMenuToggle";
import { useMemo, useState, useTransition } from "react";

interface Log {
  id: number;
  title: string;
  note: string;
  tags: string[];
}

export function LogsSectionWithTransition({ logs }: { logs: Log[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuery, setFilteredQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // useTransition を使用
  const [isPending, startTransition] = useTransition();

  // メニュートグル機能
  const menuToggleFunctions = useMenuToggle(logs, openMenuId, setOpenMenuId);

  // 重い検索処理
  const filteredLogs = useMemo(() => {
    if (!filteredQuery) return logs;

    return logs.filter(
      (log) =>
        log.title.toLowerCase().includes(filteredQuery.toLowerCase()) ||
        log.note.toLowerCase().includes(filteredQuery.toLowerCase()) ||
        log.tags.some((tag) =>
          tag.toLowerCase().includes(filteredQuery.toLowerCase())
        )
    );
  }, [logs, filteredQuery]);

  // 検索ハンドラー
  const handleSearch = (newQuery: string) => {
    // 入力フィールドは即座に更新
    setSearchQuery(newQuery);

    // 重い検索処理は遅延実行
    startTransition(() => {
      setFilteredQuery(newQuery);
    });
  };

  return (
    <div className="space-y-4">
      {/* 検索フィールド */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="ログを検索..."
          className="w-full p-3 border rounded-lg"
        />

        {/* ローディングインジケーター */}
        {isPending && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* 結果表示 */}
      <div
        className={`transition-all duration-200 ${
          isPending ? "opacity-60 pointer-events-none" : "opacity-100"
        }`}
      >
        <p className="text-sm text-gray-600 mb-3">
          {filteredLogs.length}件のログが見つかりました
        </p>

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{log.title}</h3>
                <button
                  onClick={menuToggleFunctions[log.id]}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isPending} // 検索中はメニュー操作を無効化
                >
                  ⋮
                </button>
              </div>

              <p className="text-gray-600 mt-2">{log.note}</p>

              <div className="flex gap-2 mt-3">
                {log.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
