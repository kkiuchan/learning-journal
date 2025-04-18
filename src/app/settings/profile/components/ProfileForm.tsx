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
import { storage } from "@/lib/supabaseClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/users/me", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        } as RequestInit);
        if (!response.ok) throw new Error("プロフィールの取得に失敗しました");
        const data = await response.json();

        form.reset({
          name: data.data.name || "",
          selfIntroduction: data.data.selfIntroduction || "",
          age: data.data.age,
          ageVisible: data.data.ageVisible,
          skills: data.data.skills.map((skill: { name: string }) => skill.name),
          interests: data.data.interests.map(
            (interest: { name: string }) => interest.name
          ),
          image: data.data.image || null,
        });

        if (data.data.image) {
          setPreviewUrl(data.data.image);
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
        toast.error("プロフィールの取得に失敗しました");
      }
    };

    fetchProfile();
  }, [form]);

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
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const responseData = await response.json();

      // セッション情報を更新
      if (session) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            image: values.image,
          },
        });
      }

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
