import { createClient } from "@supabase/supabase-js";

// 環境変数の存在チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// 共通のSupabaseクライアントを作成
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ストレージ関連のヘルパー関数
export const storage = {
  // プロフィール画像のアップロード
  uploadProfileImage: async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `profile-image/${fileName}`;

    const { error } = await supabase.storage
      .from("profile-image")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("profile-image")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // リソースファイルのアップロード
  uploadResource: async (file: File, unitId: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${unitId}/${fileName}`;

    const { error } = await supabase.storage
      .from("resources")
      .upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage.from("resources").getPublicUrl(filePath);

    return data.publicUrl;
  },

  getResourceUrl: (filePath: string): string => {
    const { data } = supabase.storage.from("resources").getPublicUrl(filePath);
    return data.publicUrl;
  },

  // ファイルの削除
  deleteFile: async (path: string): Promise<void> => {
    const { error } = await supabase.storage.from("resources").remove([path]);
    if (error) throw error;
  },
};
