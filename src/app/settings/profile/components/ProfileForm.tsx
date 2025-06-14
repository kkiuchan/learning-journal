"use client";

import { TagInput } from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/contexts/SupabaseAuthStore";
import { supabase } from "@/lib/supabase-auth";
import { storage } from "@/lib/supabaseClient";
import { AuthSession } from "@/types/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import { z } from "zod";

const profileFormSchema = z.object({
  name: z.string().nullable(),
  selfIntroduction: z.string().nullable(),
  age: z.number().nullable(),
  ageVisible: z.boolean(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  image: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const router = useRouter();
  const { session: supabaseSession } = useAuthStore();
  const accessToken = supabaseSession?.access_token;

  // Supabaseセッションを NextAuth.js 互換形式に変換
  const session: AuthSession | null = supabaseSession
    ? {
        user: {
          id: supabaseSession.user.id,
          email: supabaseSession.user.email || "",
          name:
            supabaseSession.user.user_metadata?.name ||
            supabaseSession.user.user_metadata?.full_name ||
            "",
          image:
            supabaseSession.user.user_metadata?.avatar_url ||
            supabaseSession.user.user_metadata?.picture ||
            "",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null;

  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // SWR fetcher with Supabase auth headers
  const fetcher = (url: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    return fetch(url, { headers }).then((res) => res.json());
  };

  // SWRでプロフィールデータを取得
  const { data: profileData, error, mutate } = useSWR("/api/users/me", fetcher);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      selfIntroduction: "",
      age: null,
      ageVisible: false,
      skills: [],
      interests: [],
      image: null,
    },
  });

  // プロフィールデータが取得できたらフォームに設定
  useEffect(() => {
    if (profileData?.data) {
      form.reset({
        name: profileData.data.name || "",
        selfIntroduction: profileData.data.selfIntroduction || "",
        age: profileData.data.age,
        ageVisible: profileData.data.ageVisible,
        skills: (profileData.data.skills ?? []).map(
          (skill: { name: string }) => skill.name
        ),
        interests: (profileData.data.interests ?? []).map(
          (interest: { name: string }) => interest.name
        ),
        image: profileData.data.image || null,
      });

      if (profileData.data.image) {
        setPreviewUrl(profileData.data.image);
      }
    }
  }, [profileData, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setUploadingImage(true);
    try {
      const publicUrl = await storage.uploadProfileImage(selectedImage);
      form.setValue("image", publicUrl);
      setPreviewUrl(publicUrl);
      toast.success("画像をアップロードしました");
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      toast.error("画像のアップロードに失敗しました");
    } finally {
      setUploadingImage(false);
      setSelectedImage(null);
    }
  };

  async function onSubmit(values: ProfileFormValues) {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };

      // 画像が更新された場合はSupabase Authのuser_metadata.avatar_urlも更新
      if (values.image) {
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: { avatar_url: values.image },
        });
        if (updateUserError) {
          console.error("Supabase Authの画像更新エラー:", updateUserError);
          toast.error("認証プロフィール画像の更新に失敗しました");
        }
      }

      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers,
        body: JSON.stringify(values),
      });

      const responseData = await response.json();

      // SWRキャッシュを更新
      await mutate();

      toast.success("プロフィールを更新しました");

      // 更新後のユーザーIDを使用してリダイレクト
      if (responseData.data?.id) {
        router.push(`/users/${responseData.data.id}`);
      }
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast.error("プロフィールの更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  // ローディング状態の表示
  if (!profileData && !error) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">プロフィールの読み込みに失敗しました</p>
        <Button onClick={() => mutate()} className="mt-4">
          再試行
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>プロフィール画像</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {previewUrl && (
                    <div className="relative w-32 h-32">
                      <Image
                        src={previewUrl}
                        alt="プロフィール画像"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                    <Button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={!selectedImage || uploadingImage}
                    >
                      {uploadingImage ? "アップロード中..." : "アップロード"}
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                プロフィール画像をアップロードできます
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>名前</FormLabel>
              <FormControl>
                <Input
                  placeholder="名前を入力"
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selfIntroduction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>自己紹介</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="自己紹介を入力"
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-start gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>年齢</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="年齢を入力"
                    {...field}
                    value={field.value || ""}
                    disabled={isLoading}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value ? parseInt(value) : null;
                      if (
                        numValue === null ||
                        (numValue >= 0 && numValue <= 120)
                      ) {
                        field.onChange(numValue);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  0〜120歳の範囲で入力してください
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ageVisible"
            render={({ field }) => (
              <FormItem className="flex-1">
                <div className="flex pt-6 items-center justify-between space-y-0">
                  <div>
                    <FormLabel className="text-base">年齢を公開</FormLabel>
                    <FormDescription>
                      年齢をプロフィールに表示するかどうか
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-blue-600"
                      disabled={isLoading}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>スキル</FormLabel>
              <FormControl>
                <TagInput
                  placeholder="スキルを入力（Enter で追加）"
                  tags={field.value}
                  setTags={field.onChange}
                  maxTags={10}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>最大10個まで登録できます</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="interests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>興味・関心</FormLabel>
              <FormControl>
                <TagInput
                  placeholder="興味・関心を入力（Enter で追加）"
                  tags={field.value}
                  setTags={field.onChange}
                  maxTags={10}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>最大10個まで登録できます</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "更新中..." : "更新"}
        </Button>
      </form>
    </Form>
  );
}
