-- ステータスを英語に変換
UPDATE "Unit"
SET status = CASE
  WHEN status = '計画中' THEN 'PLANNED'
  WHEN status = '進行中' THEN 'IN_PROGRESS'
  WHEN status = '完了' THEN 'COMPLETED'
  ELSE status
END
WHERE status IN ('計画中', '進行中', '完了'); 