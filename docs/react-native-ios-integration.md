# Learning Journal React Native/Expo iOS アプリ連携ガイド

## 📋 概要

本ドキュメントは、現在のLearning Journalプロジェクトのバックエンド、データベース、認証機能をReact Native/Expo iOSアプリから利用するための詳細な技術情報をまとめています。

## 🏗️ 現在のプロジェクト構成

### バックエンド技術スタック

- **フレームワーク**: Next.js 15.2.2 (App Router)
- **認証**: NextAuth.js 4.24.11 (JWT戦略)
- **データベース**: PostgreSQL + Prisma 6.6.0
- **ファイルストレージ**: Supabase Storage
- **APIドキュメント**: Swagger/OpenAPI 3.0.0
- **セキュリティ**: レート制限、入力値検証、XSS対策

### 認証プロバイダー

- ✅ **Google OAuth**
- ✅ **GitHub OAuth**
- ✅ **Discord OAuth**
- ✅ **メール・パスワード認証**

---

## 🔐 認証システム詳細

### 現在の認証フロー

```typescript
// NextAuth.js設定 (src/auth.config.ts)
providers: [
  Credentials({
    async authorize(credentials) {
      // メール・パスワード認証
      const user = await prisma.user.findUnique({
        where: { email: credentials.email }
      });

      // パスワード検証
      const isValid = await bcryptjs.compare(
        credentials.password,
        user.hashedPassword
      );

      return isValid ? user : null;
    }
  }),
  Google({ ... }),
  Github({ ... }),
  Discord({ ... })
]
```

### JWT設定

```typescript
// JWTコールバック
jwt: async ({ token, account, user }) => {
  if (account) {
    token.accessToken = account.access_token;
  }
  if (user) {
    token.id = user.id;
    token.primaryAuthMethod = user.primaryAuthMethod;
  }
  return token;
};

// セッションコールバック
session: async ({ session, token }) => {
  session.user.id = token.id;
  session.user.primaryAuthMethod = token.primaryAuthMethod;
  return session;
};
```

---

## 🗄️ データベーススキーマ

### 主要テーブル構造

#### User テーブル

```prisma
model User {
  id                   String           @id @default(cuid())
  name                 String?
  topImage             String?
  age                  Int?
  ageVisible           Boolean          @default(true)
  email                String           @unique
  hashedPassword       String?
  primaryAuthMethod    String           // "google", "github", "discord", "email"
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
  subscriptionStatus   String?
  subscriptionPlan     String?
  subscriptionStart    DateTime?
  subscriptionEnd      DateTime?
  trialEnd             DateTime?
  emailVerified        DateTime?
  image                String?
  selfIntroduction     String?
  stripeCustomerId     String?          @unique
  stripePriceId        String?
  stripeSubscriptionId String?          @unique

  // リレーション
  accounts             Account[]
  units                Unit[]
  logs                 Log[]
  userSkills           UserSkill[]
  userInterests        UserInterest[]
}
```

#### Unit テーブル（学習単位）

```prisma
model Unit {
  id               Int        @id @default(autoincrement())
  userId           String
  title            String
  learningGoal     String?
  preLearningState String?
  reflection       String?
  nextAction       String?
  achievementLevel Int?       @default(0)
  startDate        DateTime?
  endDate          DateTime?
  displayFlag      Boolean    @default(true)  // 公開設定
  status           String     @default("PLANNED") // PLANNED, IN_PROGRESS, COMPLETED
  likesCount       Int        @default(0)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  commentsCount    Int        @default(0)

  // リレーション
  user             User       @relation(fields: [userId], references: [id])
  logs             Log[]
  comments         Comment[]
  unitLikes        UnitLike[]
  unitTags         UnitTag[]
}
```

#### Log テーブル（学習記録）

```prisma
model Log {
  id           Int        @id @default(autoincrement())
  unitId       Int
  userId       String
  title        String
  learningTime Int?       // 分単位
  note         String?
  logDate      DateTime
  effectScore  Int?       // 1-5の効果スコア
  effectType   String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  // リレーション
  unit         Unit       @relation(fields: [unitId], references: [id])
  user         User       @relation(fields: [userId], references: [id])
  logTags      LogTag[]
  resources    Resource[]
}
```

---

## 🚀 API エンドポイント詳細

### ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: `https://learning-journal.vercel.app`

### 認証API

#### 1. メール・パスワード認証

```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "ユーザー名"
}

// POST /api/auth/[...nextauth]
// NextAuth.js標準エンドポイント
```

#### 2. OAuth認証

```typescript
// Google OAuth
GET / api / auth / signin / google;

// GitHub OAuth
GET / api / auth / signin / github;

// Discord OAuth
GET / api / auth / signin / discord;
```

### ユーザー管理API

#### 現在のユーザー情報取得

```typescript
// GET /api/users/me
Headers: {
  "Cookie": "next-auth.session-token=xxx"
}

Response: {
  "data": {
    "id": "user_id",
    "name": "ユーザー名",
    "email": "user@example.com",
    "image": "profile_image_url",
    "topImage": "top_image_url",
    "selfIntroduction": "自己紹介文",
    "age": 25,
    "ageVisible": true,
    "primaryAuthMethod": "google",
    "skills": [
      { "id": "1", "name": "JavaScript" },
      { "id": "2", "name": "React" }
    ],
    "interests": [
      { "id": "3", "name": "Web開発" }
    ]
  }
}
```

#### ユーザー情報更新

```typescript
// PUT /api/users/me
{
  "name": "新しい名前",
  "selfIntroduction": "更新された自己紹介",
  "age": 26,
  "ageVisible": false,
  "skills": ["JavaScript", "TypeScript", "React"],
  "interests": ["Web開発", "機械学習"]
}
```

### 学習ユニット管理API

#### ユニット一覧取得

```typescript
// GET /api/units?query=JavaScript&status=IN_PROGRESS&page=1&limit=20
Response: {
  "data": {
    "units": [
      {
        "id": 1,
        "title": "React基礎学習",
        "learningGoal": "Reactの基本概念を理解する",
        "status": "IN_PROGRESS",
        "userId": "user_id",
        "user": {
          "id": "user_id",
          "name": "ユーザー名",
          "image": "profile_url"
        },
        "unitTags": [
          { "tag": { "id": 1, "name": "React" } }
        ],
        "_count": {
          "logs": 5,
          "comments": 2
        },
        "likesCount": 10,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

#### ユニット作成

```typescript
// POST /api/units
{
  "title": "新しい学習ユニット",
  "learningGoal": "学習目標",
  "preLearningState": "事前学習状態",
  "startDate": "2024-01-01T00:00:00Z",
  "displayFlag": true,
  "tags": ["JavaScript", "React"]
}
```

#### ユニット詳細取得

```typescript
// GET /api/units/{id}
Response: {
  "data": {
    "id": 1,
    "title": "React基礎学習",
    "learningGoal": "目標",
    "preLearningState": "事前状態",
    "reflection": "振り返り",
    "nextAction": "次のアクション",
    "status": "IN_PROGRESS",
    "achievementLevel": 75,
    "logs": [
      {
        "id": 1,
        "title": "学習記録1",
        "learningTime": 120,
        "note": "ノート",
        "logDate": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 学習記録API

#### ログ作成

```typescript
// POST /api/units/{unitId}/logs
{
  "title": "学習記録タイトル",
  "learningTime": 60,
  "note": "学習内容のノート",
  "logDate": "2024-01-01T00:00:00Z",
  "effectScore": 4,
  "effectType": "理解度向上",
  "tags": ["実践", "理解"],
  "resources": [
    {
      "resourceType": "URL",
      "resourceLink": "https://example.com",
      "description": "参考資料"
    }
  ]
}
```

#### ログ一覧取得

```typescript
// GET /api/units/{unitId}/logs
Response: {
  "data": [
    {
      "id": 1,
      "title": "学習記録",
      "learningTime": 60,
      "note": "ノート",
      "logDate": "2024-01-01T00:00:00Z",
      "effectScore": 4,
      "logTags": [
        { "tag": { "name": "実践" } }
      ],
      "resources": [
        {
          "resourceType": "URL",
          "resourceLink": "https://example.com",
          "description": "参考資料"
        }
      ]
    }
  ]
}
```

### 🤖 AI機能API

### AIアドバイス取得

#### エンドポイント詳細

```typescript
// POST /api/advice
Headers: {
  "Content-Type": "application/json",
  "Cookie": "next-auth.session-token=xxx"
}

Request: {
  "unitId": "1",
  "role": "expert" | "mentor"  // オプション、デフォルト: "expert"
}
```

#### レスポンス（Server-Sent Events）

```typescript
// ストリーミングレスポンス例
data: {"event":"content","data":{"choices":[{"delta":{"content":"学習に関する"}}]}}
data: {"event":"content","data":{"choices":[{"delta":{"content":"具体的なアドバイス..."}}]}}
data: {"event":"done"}

// エラーレスポンス（通常のJSON）
{
  "error": "Unit ID is required",
  "status": 400
}

// プラン制限エラー
{
  "code": "PLAN_LIMIT_EXCEEDED",
  "error": "AIアドバイス機能はプロプランでご利用いただけます",
  "status": 403
}
```

#### 認証・セキュリティ

- ✅ **認証必須**: NextAuth.js セッション
- ✅ **プラン制限**: プロプラン限定機能
- ✅ **所有者確認**: 自分のユニットでのみ利用可能
- ✅ **レート制限**: 1分間60リクエスト

#### AI設定

- **モデル**: GPT-4.1-nano
- **最大トークン**: 1,000
- **温度設定**: 0.7
- **ストリーミング**: 有効

#### React Native実装例

```typescript
// services/aiService.ts
interface AdviceRequest {
  unitId: string;
  role?: "expert" | "mentor";
}

class AIService {
  async getAdvice(request: AdviceRequest): Promise<ReadableStream> {
    const response = await fetch(`${this.baseURL}/api/advice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "アドバイス取得に失敗しました");
    }

    return response.body!;
  }

  async processAdviceStream(
    stream: ReadableStream,
    onContent: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (
                data.event === "content" &&
                data.data.choices[0]?.delta?.content
              ) {
                onContent(data.data.choices[0].delta.content);
              } else if (data.event === "done") {
                onComplete();
                return;
              }
            } catch (e) {
              console.error("SSE解析エラー:", e);
            }
          }
        }
      }
    } catch (error) {
      onError(
        error instanceof Error ? error : new Error("ストリーミングエラー")
      );
    }
  }
}

export const aiService = new AIService();
```

#### 使用例（React Native）

```typescript
// components/AdviceComponent.tsx
import { useState } from "react";
import { aiService } from "../services/aiService";

export function AdviceComponent({ unitId }: { unitId: string }) {
  const [advice, setAdvice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"expert" | "mentor">("expert");

  const handleGetAdvice = async () => {
    try {
      setIsLoading(true);
      setAdvice("");

      const stream = await aiService.getAdvice({ unitId, role });

      await aiService.processAdviceStream(
        stream,
        (content) => setAdvice(prev => prev + content),
        () => setIsLoading(false),
        (error) => {
          console.error("アドバイス取得エラー:", error);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("エラー:", error);
      setIsLoading(false);
    }
  };

  return (
    <View>
      <Picker
        selectedValue={role}
        onValueChange={setRole}
        style={styles.picker}
      >
        <Picker.Item label="専門家モード" value="expert" />
        <Picker.Item label="メンターモード" value="mentor" />
      </Picker>

      <Button
        title={isLoading ? "生成中..." : "AIアドバイスを取得"}
        onPress={handleGetAdvice}
        disabled={isLoading}
      />

      <ScrollView style={styles.adviceContainer}>
        <Text style={styles.advice}>{advice}</Text>
      </ScrollView>
    </View>
  );
}
```

---

## 📧 お問い合わせ・サポートAPI

### お問い合わせフォーム送信

#### エンドポイント詳細

```typescript
// POST /api/contact
Headers: {
  "Content-Type": "application/json"
}

Request: {
  "name": "お客様の名前",
  "email": "customer@example.com",
  "subject": "お問い合わせ件名",
  "category": "general" | "technical" | "billing" | "feature",
  "message": "お問い合わせ内容（10文字以上）"
}
```

#### カテゴリ詳細

```typescript
// お問い合わせカテゴリ一覧
const contactCategories = {
  general: "一般的なお問い合わせ",
  technical: "技術的な問題",
  billing: "請求・支払いについて",
  feature: "機能追加のご提案",
};
```

#### レスポンス

```typescript
// 成功レスポンス
{
  "success": true,
  "message": "お問い合わせを正常に送信しました",
  "emailIds": {
    "admin": "email_id_123",
    "customer": "email_id_456"
  }
}

// バリデーションエラー
{
  "error": {
    "message": "入力内容に不備があります",
    "details": [
      {
        "path": ["name"],
        "message": "お名前を入力してください"
      },
      {
        "path": ["email"],
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  }
}

// サーバーエラー
{
  "error": {
    "message": "お問い合わせの送信中にエラーが発生しました",
    "details": "Network error details"
  }
}
```

#### メール送信機能

**2通のメールが自動送信されます：**

1. **管理者への通知メール**

   - 宛先: 環境変数 `ADMIN_EMAIL` または `SUPPORT_EMAIL`
   - 返信先: お客様のメールアドレス
   - 内容: お問い合わせ詳細情報

2. **お客様への自動返信メール**
   - 宛先: お客様のメールアドレス
   - 返信先: 管理者メールアドレス
   - 内容: 受付確認と今後の流れ

#### セキュリティ・バリデーション

- ✅ **入力値検証**: Zodスキーマによる厳密な検証
- ✅ **XSS対策**: HTMLエスケープ処理
- ✅ **必須項目**: 名前、メール、件名、カテゴリ、メッセージ
- ✅ **メール形式**: RFC準拠のメールアドレス検証
- ✅ **文字数制限**: メッセージ最低10文字以上

#### React Native実装例

```typescript
// services/contactService.ts
interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  category: "general" | "technical" | "billing" | "feature";
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  emailIds?: {
    admin: string;
    customer: string;
  };
}

interface ContactError {
  error: {
    message: string;
    details?: Array<{
      path: string[];
      message: string;
    }>;
  };
}

class ContactService {
  private baseURL = "https://learning-journal.vercel.app";

  async submitContact(request: ContactRequest): Promise<ContactResponse> {
    const response = await fetch(`${this.baseURL}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ContactSubmissionError(
        data.error?.message || "お問い合わせの送信に失敗しました",
        data.error?.details
      );
    }

    return data;
  }

  // カテゴリ選択肢取得
  getCategories() {
    return [
      { value: "general", label: "一般的なお問い合わせ" },
      { value: "technical", label: "技術的な問題" },
      { value: "billing", label: "請求・支払いについて" },
      { value: "feature", label: "機能追加のご提案" },
    ];
  }

  // フォームバリデーション
  validateForm(data: Partial<ContactRequest>): string[] {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("お名前を入力してください");
    }

    if (!data.email?.trim()) {
      errors.push("メールアドレスを入力してください");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("有効なメールアドレスを入力してください");
    }

    if (!data.subject?.trim()) {
      errors.push("件名を入力してください");
    }

    if (!data.category) {
      errors.push("カテゴリを選択してください");
    }

    if (!data.message?.trim()) {
      errors.push("お問い合わせ内容を入力してください");
    } else if (data.message.trim().length < 10) {
      errors.push("お問い合わせ内容は10文字以上入力してください");
    }

    return errors;
  }
}

export const contactService = new ContactService();

// カスタムエラークラス
export class ContactSubmissionError extends Error {
  public details?: Array<{ path: string[]; message: string }>;

  constructor(
    message: string,
    details?: Array<{ path: string[]; message: string }>
  ) {
    super(message);
    this.name = "ContactSubmissionError";
    this.details = details;
  }
}
```

#### 使用例（React Native）

```typescript
// components/ContactForm.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { contactService, ContactSubmissionError } from "../services/contactService";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "general" as const,
    message: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = contactService.getCategories();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async () => {
    // フロントエンドバリデーション
    const validationErrors = contactService.validateForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      Alert.alert("入力エラー", validationErrors.join("\n"));
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const response = await contactService.submitContact(formData);

      Alert.alert(
        "送信完了",
        "お問い合わせを送信しました。確認メールをご確認ください。",
        [
          {
            text: "OK",
            onPress: () => {
              // フォームをリセット
              setFormData({
                name: "",
                email: "",
                subject: "",
                category: "general",
                message: "",
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("お問い合わせ送信エラー:", error);

      if (error instanceof ContactSubmissionError) {
        if (error.details && error.details.length > 0) {
          const errorMessages = error.details.map(detail => detail.message);
          setErrors(errorMessages);
          Alert.alert("入力エラー", errorMessages.join("\n"));
        } else {
          Alert.alert("エラー", error.message);
        }
      } else {
        Alert.alert("エラー", "お問い合わせの送信中にエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>お問い合わせ</Text>
        <Text style={styles.description}>
          ご質問やサポートが必要な場合は、こちらからお気軽にお問い合わせください。
        </Text>

        {/* お名前 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>お名前 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.input,
              errors.some(e => e.includes("名前")) && styles.inputError
            ]}
            placeholder="山田太郎"
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
            editable={!isSubmitting}
            autoCapitalize="words"
          />
        </View>

        {/* メールアドレス */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>メールアドレス <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.input,
              errors.some(e => e.includes("メール")) && styles.inputError
            ]}
            placeholder="example@email.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />
        </View>

        {/* カテゴリ */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>カテゴリ <Text style={styles.required}>*</Text></Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
              enabled={!isSubmitting}
              style={styles.picker}
            >
              {categories.map((category) => (
                <Picker.Item
                  key={category.value}
                  label={category.label}
                  value={category.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* 件名 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>件名 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.input,
              errors.some(e => e.includes("件名")) && styles.inputError
            ]}
            placeholder="例：サブスクリプションの解約について"
            value={formData.subject}
            onChangeText={(value) => handleInputChange("subject", value)}
            editable={!isSubmitting}
          />
        </View>

        {/* お問い合わせ内容 */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>お問い合わせ内容 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.textArea,
              errors.some(e => e.includes("内容")) && styles.inputError
            ]}
            placeholder="お問い合わせ内容を詳しくご記入ください。技術的な問題の場合は、お使いのデバイスやエラーメッセージも併せてお知らせください。"
            value={formData.message}
            onChangeText={(value) => handleInputChange("message", value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.characterCount}>
            {formData.message.length} / 10文字以上
          </Text>
        </View>

        {/* エラー表示 */}
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>• {error}</Text>
            ))}
          </View>
        )}

        {/* 送信ボタン */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "送信中..." : "お問い合わせを送信"}
          </Text>
        </TouchableOpacity>

        {/* 注意事項 */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            <Text style={styles.required}>*</Text> 印は必須項目です。{"\n"}
            お問い合わせいただいた内容に対しては、通常1〜2営業日以内にご返信いたします。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  formContainer: {
    padding: 20,
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 24,
    lineHeight: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  required: {
    color: "#dc3545",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    minHeight: 120,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
  },
  characterCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#721c24",
    fontSize: 14,
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  noticeContainer: {
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
  },
  noticeText: {
    fontSize: 12,
    color: "#495057",
    lineHeight: 18,
  },
});
```

---

## 📊 ダッシュボード統計・分析API

### 学習統計データ取得

#### エンドポイント詳細

```typescript
// GET /api/dashboard
Headers: {
  "Cookie": "next-auth.session-token=xxx"
}

// パラメータ不要（認証されたユーザーの情報を自動取得）
```

#### レスポンス

```typescript
// 成功レスポンス
{
  "stats": {
    "totalLearningTime": 48.5,      // 今月の総学習時間（時間）
    "completedUnitsCount": 3,       // 完了済みユニット数
    "activeUnitsCount": 4,          // 進行中ユニット数
    "streakDays": 12               // 連続学習日数
  },
  "activeUnits": [
    {
      "title": "React基礎学習",
      "progress": 85,               // 進捗率（0-100%）
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-03-01T00:00:00.000Z"
    }
  ],
  "recentLogs": [
    {
      "title": "React Hooksの実践",
      "date": "2024-01-15T09:00:00.000Z",
      "duration": 120,              // 学習時間（分）
      "content": "useStateとuseEffectの基本的な使い方を学習",
      "unitTitle": "React基礎学習"
    }
  ],
  "progressData": [
    {
      "name": "1/15",               // 日付表示
      "hours": 2.5                 // その日の学習時間（時間）
    },
    // ... 直近7日間のデータ
  ]
}

// 認証エラー
{
  "error": "認証が必要です",
  "status": 401
}

// データベースエラー
{
  "error": "データベースエラーが発生しました",
  "status": 500
}
```

#### 機能詳細

**📈 統計情報**

- **今月の総学習時間**: 当月1日から現在までの累計学習時間
- **完了済みユニット数**: ステータスが`COMPLETED`のユニット数
- **進行中ユニット数**: ステータスが`IN_PROGRESS`のユニット数
- **連続学習日数**: 最新の連続学習記録（今日を基準とした計算）

**📚 進行中ユニット**

- ユニットタイトルと進捗率
- 開始日・終了日情報
- 進捗計算ロジック（目標学習時間20時間 = 1200分基準）

**📝 最近の学習ログ**

- 最新5件の学習記録
- 学習時間、内容、所属ユニット情報

**📊 学習時間推移**

- 直近7日間の日別学習時間
- 棒グラフ表示用データ形式

#### セキュリティ・認証

- ✅ **認証必須**: NextAuth.js セッション認証
- ✅ **ユーザー固有**: ログインユーザーのデータのみ取得
- ✅ **エラーハンドリング**: 認証・DB接続エラー対応
- ✅ **タイムゾーン対応**: JST（日本標準時）での日付計算

#### 特殊なロジック

**連続学習日数計算**

```typescript
// 連続学習日数の計算アルゴリズム
function calculateStreakDays(recentLogs: LogDate[]) {
  let streakDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // 今日から遡って連続記録をカウント
  for (const log of recentLogs) {
    const logDate = new Date(log.logDate);
    logDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streakDays) {
      streakDays++;
      currentDate = logDate;
    } else {
      break; // 連続記録が途切れた
    }
  }

  return streakDays;
}
```

**ユニット進捗計算**

```typescript
// ユニット進捗の計算アルゴリズム
function calculateUnitProgress(unit: Unit) {
  const targetLearningTime = 1200; // 20時間 = 1200分
  const totalLearningTime = unit.logs.reduce(
    (acc, log) => acc + (log.learningTime || 0),
    0
  );

  const progress = Math.min(
    (totalLearningTime / targetLearningTime) * 100,
    100
  );

  return Math.round(progress);
}
```

#### React Native実装例

```typescript
// services/dashboardService.ts
interface DashboardStats {
  totalLearningTime: number;
  completedUnitsCount: number;
  activeUnitsCount: number;
  streakDays: number;
}

interface ActiveUnit {
  title: string;
  progress: number;
  startDate: string;
  endDate: string;
}

interface RecentLog {
  title: string;
  date: string;
  duration: number;
  content: string;
  unitTitle: string;
}

interface ProgressData {
  name: string;
  hours: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  activeUnits: ActiveUnit[];
  recentLogs: RecentLog[];
  progressData: ProgressData[];
}

class DashboardService {
  private baseURL = "https://learning-journal.vercel.app";

  async getDashboardData(): Promise<DashboardResponse> {
    const response = await fetch(`${this.baseURL}/api/dashboard`, {
      method: "GET",
      headers: {
        ...(await this.getAuthHeaders()),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("認証が必要です");
      }
      throw new Error("ダッシュボードデータの取得に失敗しました");
    }

    return response.json();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    // 認証ヘッダーの取得ロジック（既存のAPIクライアントと同様）
    const token = await this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // 統計情報のフォーマット
  formatStats(stats: DashboardStats) {
    return {
      totalLearningTime: `${stats.totalLearningTime.toFixed(1)}時間`,
      completedUnits: `${stats.completedUnitsCount}個`,
      activeUnits: `${stats.activeUnitsCount}個`,
      streakDays: `${stats.streakDays}日`,
    };
  }

  // 学習時間の単位変換
  formatLearningTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}時間${remainingMinutes}分`
      : `${hours}時間`;
  }

  // 連続学習日数のメッセージ生成
  getStreakMessage(days: number): string {
    if (days === 0) return "今日から学習を始めましょう！";
    if (days === 1) return "素晴らしいスタートです！";
    if (days < 7) return `${days}日連続！この調子で続けましょう。`;
    if (days < 30) return `${days}日連続！習慣化されてきましたね。`;
    return `${days}日連続！驚異的な継続力です！`;
  }
}

export const dashboardService = new DashboardService();
```

#### 使用例（React Native）

```typescript
// components/Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  BarChart,
  LineChart,
} from "react-native-chart-kit";
import { dashboardService } from "../services/dashboardService";

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("ダッシュボードデータ読み込みエラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!dashboardData) {
    return <ErrorMessage onRetry={loadDashboardData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ダッシュボード</Text>
        <Text style={styles.headerSubtitle}>
          学習進捗状況と最近の活動
        </Text>
      </View>

      {/* 統計カード */}
      <View style={styles.statsContainer}>
        <StatCard
          title="今月の学習時間"
          value={`${dashboardData.stats.totalLearningTime.toFixed(1)}時間`}
          icon="📚"
          color="#4F46E5"
        />
        <StatCard
          title="完了ユニット"
          value={`${dashboardData.stats.completedUnitsCount}個`}
          icon="✅"
          color="#059669"
        />
        <StatCard
          title="進行中ユニット"
          value={`${dashboardData.stats.activeUnitsCount}個`}
          icon="📖"
          color="#DC2626"
        />
        <StatCard
          title="継続日数"
          value={`${dashboardData.stats.streakDays}日`}
          icon="🔥"
          color="#EA580C"
        />
      </View>

      {/* 学習時間推移グラフ */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>学習時間の推移（7日間）</Text>
        <BarChart
          data={{
            labels: dashboardData.progressData.map(item => item.name),
            datasets: [{
              data: dashboardData.progressData.map(item => item.hours),
            }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#4F46E5",
            },
          }}
          style={styles.chart}
          verticalLabelRotation={30}
        />
      </View>

      {/* 進行中ユニット */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>進行中のユニット</Text>
        {dashboardData.activeUnits.map((unit, index) => (
          <ActiveUnitCard key={index} unit={unit} />
        ))}
      </View>

      {/* 最近の学習ログ */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>最近の学習記録</Text>
        {dashboardData.recentLogs.map((log, index) => (
          <RecentLogCard key={index} log={log} />
        ))}
      </View>

      {/* 連続学習メッセージ */}
      <View style={styles.motivationContainer}>
        <Text style={styles.motivationIcon}>🎯</Text>
        <Text style={styles.motivationText}>
          {dashboardService.getStreakMessage(dashboardData.stats.streakDays)}
        </Text>
      </View>
    </ScrollView>
  );
}

// 統計カードコンポーネント
function StatCard({ title, value, icon, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statCardIcon}>{icon}</Text>
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    </View>
  );
}

// 進行中ユニットカード
function ActiveUnitCard({ unit }) {
  return (
    <View style={styles.unitCard}>
      <Text style={styles.unitTitle}>{unit.title}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${unit.progress}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{unit.progress}%</Text>
      </View>
      {unit.startDate && (
        <Text style={styles.unitDate}>
          開始: {new Date(unit.startDate).toLocaleDateString('ja-JP')}
        </Text>
      )}
    </View>
  );
}

// 最近のログカード
function RecentLogCard({ log }) {
  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logTitle}>{log.title}</Text>
        <Text style={styles.logDuration}>
          {dashboardService.formatLearningTime(log.duration)}
        </Text>
      </View>
      <Text style={styles.logUnit}>{log.unitTitle}</Text>
      <Text style={styles.logDate}>
        {new Date(log.date).toLocaleString('ja-JP')}
      </Text>
      {log.content && (
        <Text style={styles.logContent} numberOfLines={2}>
          {log.content}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6c757d",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statCardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statCardTitle: {
    fontSize: 14,
    color: "#6c757d",
    flex: 1,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  unitCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  unitDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  logCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
  },
  logDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  logUnit: {
    fontSize: 14,
    color: "#4F46E5",
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 8,
  },
  logContent: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  motivationContainer: {
    backgroundColor: "#e3f2fd",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  motivationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  motivationText: {
    fontSize: 16,
    color: "#1565c0",
    fontWeight: "500",
    flex: 1,
    lineHeight: 24,
  },
});
```

---

## 🛡️ セキュリティ考慮事項

### 1. APIセキュリティ

- **レート制限**: 1分間に60リクエスト
- **入力値検証**: Zodスキーマによる検証
- **XSS対策**: 文字列のサニタイズ
- **CORS設定**: 必要に応じて設定

### 2. 認証セキュリティ

- **JWT有効期限**: 7日間
- **トークンリフレッシュ**: 必要に応じて実装
- **SecureStore**: Expoの暗号化ストレージ使用

### 3. 通信セキュリティ

- **HTTPS通信**: 本番環境では必須
- **証明書ピニング**: 高セキュリティが必要な場合

---

## 🌐 環境変数設定

### バックエンド（Next.js）

```env
# データベース
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# 認証
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://learning-journal.vercel.app"

# OAuth設定
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# アプリURL
NEXT_PUBLIC_APP_URL="https://learning-journal.vercel.app"
```

### React Native/Expo

```typescript
// config/env.ts
export const ENV = {
  API_BASE_URL: __DEV__
    ? "http://localhost:3000"
    : "https://learning-journal.vercel.app",
  SUPABASE_URL: "https://xxx.supabase.co",
  SUPABASE_ANON_KEY: "your-supabase-anon-key",
};
```

---

## 📚 型定義

### User型

```typescript
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  topImage: string | null;
  selfIntroduction: string | null;
  age: number | null;
  ageVisible: boolean;
  primaryAuthMethod: string;
  skills: Array<{
    id: string;
    name: string;
  }>;
  interests: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
```

### Unit型

```typescript
interface Unit {
  id: number;
  title: string;
  learningGoal: string | null;
  preLearningState: string | null;
  reflection: string | null;
  nextAction: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  achievementLevel: number;
  startDate: string | null;
  endDate: string | null;
  displayFlag: boolean;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  tags: Array<{
    tag: {
      id: number;
      name: string;
    };
  }>;
  _count: {
    logs: number;
    comments: number;
  };
}
```

### Log型

```typescript
interface Log {
  id: number;
  title: string;
  learningTime: number | null;
  note: string | null;
  logDate: string;
  effectScore: number | null;
  effectType: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    tag: {
      id: number;
      name: string;
    };
  }>;
  resources: Array<{
    id: number;
    resourceType: string | null;
    resourceLink: string;
    description: string | null;
    fileName: string | null;
  }>;
}
```

---

## 🎯 実装ロードマップ

### Phase 1: 基本認証（1週間）

1. カスタム認証APIエンドポイント作成
2. React Native認証サービス実装
3. トークン管理（SecureStore）
4. 基本的なAPI呼び出し機能

### Phase 2: データ連携（1週間）

1. ユニット管理機能
2. 学習記録機能
3. ユーザープロフィール管理
4. ファイルアップロード機能

### Phase 3: 高度な機能（1週間）

1. OAuth認証（Google、GitHub、Discord）
2. リアルタイム同期（必要に応じて）
3. オフライン対応
4. プッシュ通知

### Phase 4: 最適化（1週間）

1. パフォーマンス最適化
2. エラーハンドリング強化
3. セキュリティ監査
4. テスト実装

---

## 📖 API ドキュメント

### Swagger UI

- **URL**: `https://learning-journal.vercel.app/docs`
- **JSON仕様**: `https://learning-journal.vercel.app/api/docs`

### 主要APIエンドポイント一覧

| エンドポイント                        | メソッド | 認証 | プラン | 説明                           |
| ------------------------------------- | -------- | ---- | ------ | ------------------------------ |
| **🔐 認証関連**                       |          |      |        |                                |
| `/api/auth/register`                  | POST     | ❌   | FREE   | 新規ユーザー登録               |
| `/api/auth/verify-email`              | POST     | ❌   | FREE   | メール確認メール送信           |
| `/api/auth/verify-email`              | GET      | ❌   | FREE   | メールアドレス確認実行         |
| `/api/auth/check-password`            | GET      | ✅   | FREE   | パスワード設定状況確認         |
| `/api/auth/set-password`              | POST     | ✅   | FREE   | 新規パスワード設定             |
| `/api/auth/link-account`              | POST     | ✅   | FREE   | パスワード更新・認証追加       |
| `/api/auth/unlink-account`            | POST     | ✅   | FREE   | 外部認証アカウント連携解除     |
| `/api/auth/[...nextauth]`             | ALL      | ❌   | FREE   | NextAuth.js 認証エンドポイント |
| **📚 学習管理**                       |          |      |        |                                |
| `/api/units`                          | GET      | ❌   | FREE   | ユニット一覧取得               |
| `/api/units`                          | POST     | ✅   | FREE   | ユニット作成                   |
| `/api/units/{id}`                     | GET      | ❌   | FREE   | ユニット詳細取得               |
| `/api/units/{id}`                     | PUT      | ✅   | FREE   | ユニット更新                   |
| `/api/units/{id}`                     | DELETE   | ✅   | FREE   | ユニット削除                   |
| `/api/units/{id}/logs`                | GET      | ❌   | FREE   | ログ一覧取得                   |
| `/api/units/{id}/logs`                | POST     | ✅   | FREE   | ログ作成                       |
| `/api/units/{id}/logs/{logId}`        | DELETE   | ✅   | FREE   | ログ削除                       |
| `/api/units/{id}/like`                | POST     | ✅   | FREE   | いいね追加                     |
| `/api/units/{id}/like`                | DELETE   | ✅   | FREE   | いいね削除                     |
| `/api/units/{id}/comments`            | GET      | ❌   | FREE   | コメント一覧取得               |
| `/api/units/{id}/comments`            | POST     | ✅   | FREE   | コメント追加                   |
| `/api/comments/{id}`                  | DELETE   | ✅   | FREE   | コメント削除                   |
| **👥 ユーザー管理**                   |          |      |        |                                |
| `/api/users/me`                       | GET      | ✅   | FREE   | 現在のユーザー情報             |
| `/api/users/me`                       | PUT      | ✅   | FREE   | ユーザー情報更新               |
| `/api/users/{id}`                     | GET      | ❌   | FREE   | 特定ユーザー情報               |
| `/api/users/search`                   | GET      | ❌   | FREE   | ユーザー検索                   |
| **🏷️ タグ管理**                       |          |      |        |                                |
| `/api/tags/suggest`                   | GET      | ❌   | FREE   | タグサジェスト                 |
| **🤖 AI機能**                         |          |      |        |                                |
| `/api/advice`                         | POST     | ✅   | PRO    | AIアドバイス（SSE ストリーム） |
| `/api/ai/log-assist`                  | POST     | ✅   | PRO    | AI学習サジェスト               |
| **💳 サブスクリプション**             |          |      |        |                                |
| `/api/subscriptions/checkout`         | POST     | ✅   | FREE   | Stripe チェックアウト作成      |
| `/api/subscriptions/portal`           | POST     | ✅   | PRO    | Stripe ポータル作成            |
| `/api/webhooks/stripe`                | POST     | ❌   | FREE   | Stripe Webhook                 |
| **📧 お問い合わせ・サポートAPI**      |          |      |        |                                |
| `/api/contact`                        | POST     | ❌   | FREE   | お問い合わせフォーム送信       |
| **📊 ダッシュボード統計・分析**       |          |      |        |                                |
| `/api/dashboard`                      | GET      | ✅   | FREE   | 学習統計・進捗データ取得       |
| **🛠️ エラーログ・システム診断**       |          |      |        |                                |
| `/api/logs/error`                     | POST     | ❌   | FREE   | エラーログ保存                 |
| `/api/admin/logs`                     | GET      | ✅   | FREE   | 管理者用エラーログ取得         |
| **🎨 OG画像生成・SNSシェア**          |          |      |        |                                |
| `/api/og`                             | GET      | ❌   | FREE   | 動的Open Graph画像生成         |
| **📬 Resendメール設定・診断**         |          |      |        |                                |
| `/api/resend-info`                    | GET      | ❌   | FREE   | Resend設定情報・診断取得       |
| **💳 Stripe決済・サブスクリプション** |          |      |        |                                |
| `/api/stripe/create-checkout-session` | POST     | ✅   | FREE   | チェックアウトセッション作成   |
| `/api/stripe/create-portal-session`   | POST     | ✅   | FREE   | カスタマーポータルセッション   |
| `/api/stripe/webhook`                 | POST     | ❌   | FREE   | Stripeウェブフック処理         |
| `/api/stripe/debug-customer`          | GET      | ✅   | FREE   | 顧客情報デバッグ               |
| `/api/stripe/environment-check`       | GET      | ❌   | FREE   | Stripe環境設定チェック         |

---

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. CORS エラー

```typescript
// Next.js middleware.ts
import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const response = NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}
```

#### 2. 認証トークンエラー

```typescript
// APIクライアントでのエラーハンドリング
async get<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: await this.getHeaders(),
    });

    if (response.status === 401) {
      // トークンの期限切れ
      await authService.signOut();
      throw new Error('Authentication required');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
}
```

#### 3. ファイルアップロードエラー

```typescript
// ファイルサイズ制限のチェック
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (fileSize > MAX_FILE_SIZE) {
  throw new Error("ファイルサイズは10MB以下にしてください");
}
```

---

## 📝 まとめ

このドキュメントに記載された情報を基に、React Native/Expo iOSアプリから既存のLearning Journalバックエンドを効率的に活用できます。

### 重要なポイント

1. **既存システム活用**: NextAuth.jsシステムを最大限活用
2. **段階的実装**: Phase分けで確実に進行
3. **セキュリティ重視**: 認証・通信・データ保護
4. **拡張性確保**: 将来的な機能追加を考慮

### 次のステップ

1. Phase 1の認証APIエンドポイント作成から開始
2. Swagger UIでAPI仕様を確認
3. React Nativeプロジェクトのセットアップ
4. 基本的な認証フローの実装

質問や不明点があれば、随時確認・更新していきましょう！

---

### AI学習サジェスト（ログアシスト）

#### エンドポイント詳細

```typescript
// POST /api/ai/log-assist
Headers: {
  "Content-Type": "application/json",
  "Cookie": "next-auth.session-token=xxx"
}

Request: {
  "step": 1,  // 1-4 (学習フォームのステップ)
  "data": {
    "title": "学習タイトル",
    "note": "学習内容",
    "learningTime": 60,
    "effectScore": 4,
    "effectType": "理解度向上",
    "tags": ["JavaScript", "React"]
  },
  "unitId": "1"
}
```

#### レスポンス（JSON）

```typescript
// ステップ1: タイトル提案
{
  "suggestions": {
    "titles": [
      "React基礎の実践演習",
      "React基礎の応用課題",
      "前回の続き: React基礎発展編",
      "React基礎のまとめと復習"
    ],
    "feedback": "これらの学習内容を提案した理由と、学習の進め方についてのアドバイス"
  }
}

// ステップ2: タグとアドバイス提案
{
  "suggestions": {
    "tags": ["実践", "演習", "React", "JavaScript"],
    "feedback": "学習内容の構成提案、学習のポイント、および具体的なアドバイス"
  }
}

// ステップ4: 最終タグとリソース提案
{
  "suggestions": {
    "tags": ["React", "実践", "演習", "コンポーネント", "状態管理"],
    "resources": [
      {
        "title": "React公式ドキュメント",
        "url": "https://reactjs.org/docs",
        "description": "React基礎学習のための公式ガイド"
      }
    ],
    "feedback": "学習の総合的なフィードバックと次のステップへのアドバイス"
  }
}

// エラーレスポンス
{
  "code": "PLAN_LIMIT_EXCEEDED",
  "error": "AI学習サジェスト機能はプロプランでご利用いただけます",
  "status": 403
}
```

#### 機能詳細

- **ステップ1**: 過去の学習状況に基づく学習タイトル提案
- **ステップ2**: 入力されたタイトルに適したタグとアドバイス
- **ステップ3**: 効果測定後（実装上は使用されていないが予約済み）
- **ステップ4**: 最終的なタグとリソースの提案
- **分析機能**: ユーザーの学習統計、過去のログパターン分析
- **フォールバック**: OpenAI APIエラー時の基本的な提案
- **セキュリティ**: ユニット存在確認（所有者確認は不要）

#### AI分析データ

```typescript
// 取得される学習統計情報
interface UserStats {
  totalLogs: number; // 総学習ログ数
  avgEffectScore: number; // 平均効果スコア
  avgLearningTime: number; // 平均学習時間（分）
  preferredTags: string[]; // よく使うタグ上位5つ
}

// 分析される過去ログ情報（最新10件）
interface PastLog {
  title: string;
  note: string;
  effectScore: number;
  effectType: string;
  learningTime: number;
  logDate: Date;
  logTags: Array<{ tag: { name: string } }>;
}
```

#### React Native実装例

```typescript
// services/logAssistService.ts
interface LogAssistRequest {
  step: number;
  data: {
    title?: string;
    note?: string;
    learningTime?: number;
    effectScore?: number;
    effectType?: string;
    tags?: string[];
  };
  unitId: string;
}

interface LogAssistResponse {
  suggestions: {
    titles?: string[];
    tags?: string[];
    resources?: Array<{
      title: string;
      url: string;
      description: string;
    }>;
    feedback?: string;
  };
}

class LogAssistService {
  private baseURL = "https://learning-journal.vercel.app";

  async getSuggestions(request: LogAssistRequest): Promise<LogAssistResponse> {
    const response = await fetch(`${this.baseURL}/api/ai/log-assist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await this.getAuthHeaders()),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.code === "PLAN_LIMIT_EXCEEDED") {
        throw new PlanLimitError(error.error);
      }
      throw new Error(error.error || "提案取得に失敗しました");
    }

    return response.json();
  }

  // ステップ別提案取得
  async getStepSuggestions(
    step: number,
    formData: Partial<LogAssistRequest["data"]>,
    unitId: string
  ) {
    return this.getSuggestions({
      step,
      data: formData,
      unitId,
    });
  }
}

export const logAssistService = new LogAssistService();

// プラン制限エラー
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}
```

#### 使用例（React Native）

```typescript
// components/LogWizardForm.tsx
import { useState, useCallback } from "react";
import { logAssistService, PlanLimitError } from "../services/logAssistService";

export function LogWizardForm({ unitId }: { unitId: string }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>({});
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);

  // フォームデータ
  const [formData, setFormData] = useState({
    title: "",
    note: "",
    learningTime: 30,
    effectScore: 3,
    effectType: "understanding",
    tags: [],
  });

  const getAISuggestions = useCallback(async (step: number) => {
    try {
      setAiLoading(true);
      const response = await logAssistService.getStepSuggestions(
        step,
        formData,
        unitId
      );
      setSuggestions(response.suggestions);
    } catch (error) {
      if (error instanceof PlanLimitError) {
        setShowPlanUpgrade(true);
      } else {
        Alert.alert("エラー", error.message);
      }
    } finally {
      setAiLoading(false);
    }
  }, [formData, unitId]);

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>基本情報を入力</Text>

      {/* タイトル入力 */}
      <TextInput
        style={styles.input}
        value={formData.title}
        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
        placeholder="学習内容のタイトル"
      />

      {/* AI提案ボタン */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={() => getAISuggestions(1)}
        disabled={aiLoading}
      >
        <Text style={styles.aiButtonText}>
          {aiLoading ? "提案中..." : "💡 学習内容提案"}
        </Text>
      </TouchableOpacity>

      {/* AI提案タイトル */}
      {suggestions.titles && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>📝 AI提案</Text>
          {suggestions.titles.map((title, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => setFormData(prev => ({ ...prev, title }))}
            >
              <Text style={styles.suggestionText}>{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* AIフィードバック */}
      {suggestions.feedback && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>{suggestions.feedback}</Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>学習内容を記述</Text>

      {/* AI学習ガイドボタン */}
      <TouchableOpacity
        style={[styles.aiButton, !formData.title && styles.aiButtonDisabled]}
        onPress={() => getAISuggestions(2)}
        disabled={aiLoading || !formData.title}
      >
        <Text style={styles.aiButtonText}>
          {aiLoading ? "分析中..." : "📚 学習ガイド"}
        </Text>
      </TouchableOpacity>

      {/* 学習内容入力 */}
      <TextInput
        style={styles.textArea}
        value={formData.note}
        onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
        placeholder="学習内容の詳細を記述してください"
        multiline
        numberOfLines={6}
      />

      {/* AI推奨タグ */}
      {suggestions.tags && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsTitle}>🏷️ 推奨タグ</Text>
          <View style={styles.tagsGrid}>
            {suggestions.tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.tagItem,
                  formData.tags.includes(tag) && styles.tagItemSelected
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={styles.tagText}>
                  {formData.tags.includes(tag) ? "✓" : "+"} {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <ScrollView style={styles.container}>
      {/* ステップインジケーター */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map(step => (
          <View
            key={step}
            style={[
              styles.stepDot,
              step === currentStep && styles.stepDotActive,
              step < currentStep && styles.stepDotCompleted
            ]}
          >
            <Text style={styles.stepDotText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* ステップ内容 */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {/* 他のステップも同様に実装 */}

      {/* プラン制限ダイアログ */}
      <Modal
        visible={showPlanUpgrade}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.planUpgradeModal}>
            <Text style={styles.modalTitle}>🎯 プロプラン限定機能</Text>
            <Text style={styles.modalDescription}>
              AI学習サジェスト機能はプロプランの限定機能です。
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {/* プラン アップグレード処理 */}}
            >
              <Text style={styles.upgradeButtonText}>プロプランにアップグレード</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  aiButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  aiButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  suggestionsContainer: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  suggestionItem: {
    padding: 8,
    backgroundColor: "white",
    borderRadius: 4,
    marginBottom: 8,
  },
  feedbackContainer: {
    backgroundColor: "#EBF8FF",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  // ... その他のスタイル
});
```

---

## 🔒 React Native 認証実装方法

### 推奨アプローチ: カスタムトークン認証

現在のNextAuth.jsシステムを活用し、React Native向けにカスタムAPIエンドポイントを作成します。

#### 1. カスタム認証APIエンドポイント

```typescript
// 新規作成: src/app/api/mobile-auth/signin/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();

  // 既存のCredentials認証ロジックを利用
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && (await bcryptjs.compare(password, user.hashedPassword))) {
    // JWTトークン生成
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        primaryAuthMethod: user.primaryAuthMethod,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
```

#### 2. React Native実装例

```typescript
// services/authService.ts
import * as SecureStore from "expo-secure-store";

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

class AuthService {
  private baseURL = "https://learning-journal.vercel.app";

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/mobile-auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        await SecureStore.setItemAsync("authToken", data.token);
        await SecureStore.setItemAsync("user", JSON.stringify(data.user));
        return data;
      }

      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  }

  async signOut(): Promise<void> {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("user");
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("authToken");
  }

  async getCurrentUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync("user");
    return userJson ? JSON.parse(userJson) : null;
  }
}

export const authService = new AuthService();
```

#### 3. API呼び出し用のHTTPクライアント

```typescript
// services/apiClient.ts
import { authService } from "./authService";

class ApiClient {
  private baseURL = "https://learning-journal.vercel.app";

  private async getHeaders(): Promise<HeadersInit> {
    const token = await authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // PUT, DELETE メソッドも同様に実装
}

export const apiClient = new ApiClient();
```

#### 4. OAuth認証の実装

```typescript
// services/oauthService.ts
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

class OAuthService {
  private baseURL = "https://learning-journal.vercel.app";

  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

      const authUrl =
        `${this.baseURL}/api/auth/signin/google?` +
        `callbackUrl=${encodeURIComponent(redirectUri)}`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === "success") {
        // 認証成功後の処理
        const { url } = result;
        // URLからトークンを抽出し、SecureStoreに保存
        return this.handleOAuthCallback(url);
      }

      return { success: false, error: "OAuth authentication failed" };
    } catch (error) {
      return { success: false, error: "OAuth error" };
    }
  }

  private async handleOAuthCallback(url: string): Promise<AuthResponse> {
    // コールバックURLからトークンを抽出
    // 必要に応じてバックエンドAPIを呼び出してJWTトークンを取得
  }
}

export const oauthService = new OAuthService();
```

---

## 📁 Supabase Storage 連携

### ファイルアップロード機能

```typescript
// services/storageService.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

class StorageService {
  async uploadProfileImage(fileUri: string, fileName: string): Promise<string> {
    try {
      const fileExt = fileName.split(".").pop();
      const filePath = `profile-image/${Date.now()}.${fileExt}`;

      // React Nativeでのファイル読み取り
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from("profile-image")
        .upload(filePath, blob);

      if (error) throw error;

      const { data } = supabase.storage
        .from("profile-image")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      throw new Error("Profile image upload failed");
    }
  }

  async uploadResource(
    fileUri: string,
    fileName: string,
    unitId: string
  ): Promise<string> {
    const fileExt = fileName.split(".").pop();
    const filePath = `${unitId}/${Date.now()}.${fileExt}`;

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from("resources")
      .upload(filePath, blob);

    if (error) throw error;

    const { data } = supabase.storage.from("resources").getPublicUrl(filePath);

    return data.publicUrl;
  }
}

export const storageService = new StorageService();
```

---

## 🛠️ エラーログ・システム診断API

### エラーログ保存

#### エンドポイント詳細

```typescript
// POST /api/logs/error
Headers: {
  "Content-Type": "application/json"
}

Request: {
  "message": "エラーメッセージ",
  "stack": "Error: something went wrong\n    at App.tsx:45:12\n    ...",
  "digest": "1a2b3c4d",  // Next.js エラーダイジェスト (オプション)
  "url": "https://learning-journal.vercel.app/units/123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ..."
}
```

#### レスポンス

```typescript
// 成功レスポンス
{
  "success": true
}

// バリデーションエラー
{
  "error": "入力内容に不備があります",
  "details": [
    {
      "path": ["message"],
      "message": "エラーメッセージは必須です"
    }
  ]
}

// サーバーエラー
{
  "error": "エラーログの保存に失敗しました"
}
```

#### データベーススキーマ

```prisma
// ErrorLog テーブル構造
model ErrorLog {
  id        Int      @id @default(autoincrement())
  message   String                      // エラーメッセージ（必須）
  stack     String?  @db.Text          // スタックトレース
  digest    String?                     // Next.js エラーダイジェスト
  url       String?                     // エラー発生ページURL
  userAgent String?                     // ユーザーエージェント
  timestamp DateTime @default(now())    // エラー発生時刻
  createdAt DateTime @default(now())    // レコード作成日時
  updatedAt DateTime @updatedAt         // レコード更新日時
}
```

#### 機能詳細

- ✅ **自動エラー収集**: アプリケーション全体のエラーを自動収集
- ✅ **詳細情報記録**: スタックトレース、URL、ユーザーエージェント
- ✅ **Zodバリデーション**: 厳密な入力値検証
- ✅ **ログレベル制御**: 環境変数による制御
- ✅ **開発環境対応**: デバッグモード時の動作調整

---

### 管理者用エラーログ取得

#### エンドポイント詳細

```typescript
// GET /api/admin/logs?page=1&limit=10
Headers: {
  "Cookie": "next-auth.session-token=xxx"
}

// クエリパラメータ
{
  "page": 1,        // ページ番号（デフォルト: 1）
  "limit": 10       // 取得件数（デフォルト: 10）
}
```

#### レスポンス

```typescript
// 成功レスポンス
{
  "data": [
    {
      "id": 1,
      "message": "TypeError: Cannot read properties of undefined",
      "stack": "Error: something went wrong\n    at App.tsx:45:12\n    ...",
      "digest": "1a2b3c4d",
      "url": "https://learning-journal.vercel.app/units/123",
      "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ...",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 125,
    "page": 1,
    "limit": 10,
    "totalPages": 13
  }
}

// 認証エラー
{
  "error": "認証が必要です",
  "status": 401
}
```

#### アクセス制御

- ✅ **認証必須**: NextAuth.js セッション認証
- ✅ **管理者限定**: 将来的な管理者ロール対応準備済み
- ✅ **ページネーション**: 大量データの効率的な取得
- ✅ **最新順ソート**: 新しいエラーから表示

---

### エラーロガーライブラリ

#### Error Logger の使用方法

```typescript
// lib/error-logger.ts - 自動エラー収集システム
import { logError } from "@/lib/error-logger";

// 基本的な使用方法
try {
  // 何らかの処理
  throw new Error("予期しないエラーが発生しました");
} catch (error) {
  // エラーログを自動送信
  await logError(error);

  // ユーザーにエラーメッセージを表示
  Alert.alert("エラー", "処理中にエラーが発生しました");
}

// Next.js エラーダイジェスト付きエラー
const errorWithDigest = new Error("Database connection failed");
errorWithDigest.digest = "abc123def";
await logError(errorWithDigest);
```

#### ログレベル制御

```typescript
// 環境変数による制御
// LOG_LEVEL=debug    - デバッグ情報も送信
// LOG_LEVEL=info     - 情報レベル以上を送信
// LOG_LEVEL=warn     - 警告レベル以上を送信
// LOG_LEVEL=error    - エラーレベルのみ送信

// 開発環境では自動的にコンソール出力
if (process.env.NODE_ENV === "development") {
  console.error("エラーログ:", errorData);
}
```

#### 自動収集データ

```typescript
// 自動的に収集される情報
interface ErrorLogData {
  message: string; // エラーメッセージ
  stack?: string; // スタックトレース
  digest?: string; // Next.js エラーダイジェスト
  url?: string; // 現在のページURL
  timestamp: string; // ISO8601形式の発生時刻
  userAgent?: string; // ブラウザ/アプリの情報
}
```

---

### React Native実装例

```typescript
// services/errorLogService.ts
interface ErrorLogRequest {
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
}

interface ErrorLogResponse {
  success: boolean;
}

interface AdminLogEntry {
  id: number;
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminLogsResponse {
  data: AdminLogEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ErrorLogService {
  private baseURL = "https://learning-journal.vercel.app";

  // エラーログ送信
  async logError(error: Error & { digest?: string }): Promise<void> {
    try {
      const errorData: ErrorLogRequest = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: this.getCurrentUrl(),
        timestamp: new Date().toISOString(),
        userAgent: this.getUserAgent(),
      };

      // 開発環境ではコンソールに出力
      if (__DEV__) {
        console.error("エラーログ:", errorData);
      }

      // 本番環境でのみサーバーに送信
      if (!__DEV__) {
        await this.sendErrorLog(errorData);
      }
    } catch (e) {
      console.error("エラーログの送信に失敗:", e);
    }
  }

  private async sendErrorLog(
    errorData: ErrorLogRequest
  ): Promise<ErrorLogResponse> {
    const response = await fetch(`${this.baseURL}/api/logs/error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      throw new Error(`エラーログ送信失敗: ${response.status}`);
    }

    return response.json();
  }

  // 管理者用エラーログ取得
  async getAdminLogs(
    page: number = 1,
    limit: number = 10
  ): Promise<AdminLogsResponse> {
    const response = await fetch(
      `${this.baseURL}/api/admin/logs?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          ...(await this.getAuthHeaders()),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("管理者認証が必要です");
      }
      throw new Error("エラーログの取得に失敗しました");
    }

    return response.json();
  }

  // ユーティリティメソッド
  private getCurrentUrl(): string {
    // React Navigation の現在のルート情報を取得
    // 実装は使用している Navigation ライブラリに依存
    return "app://current-screen";
  }

  private getUserAgent(): string {
    // React Native の DeviceInfo から取得
    return `LearningJournal/${Platform.OS} ${Platform.Version}`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    // 認証ヘッダーの取得（既存のAPIクライアントと同様）
    const token = await this.getStoredToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // エラー分類とフィルタリング
  getErrorSeverity(error: Error): "low" | "medium" | "high" | "critical" {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("timeout")) {
      return "low";
    }
    if (message.includes("authentication") || message.includes("permission")) {
      return "medium";
    }
    if (message.includes("database") || message.includes("server")) {
      return "high";
    }
    if (message.includes("crash") || message.includes("fatal")) {
      return "critical";
    }

    return "medium";
  }
}

export const errorLogService = new ErrorLogService();

// グローバルエラーハンドラー設定
export function setupGlobalErrorHandler() {
  // Unhandled Promise Rejection
  const originalHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    errorLogService.logError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`)
    );
    if (originalHandler) {
      originalHandler(event);
    }
  };

  // JavaScript エラー
  const originalErrorHandler = global.ErrorUtils?.setGlobalHandler;
  if (originalErrorHandler) {
    originalErrorHandler((error, isFatal) => {
      errorLogService.logError(error);
      // アプリクラッシュを防ぐため、必要に応じてデフォルトハンドラーを呼び出し
    });
  }
}
```

#### 使用例（React Native）

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { errorLogService } from "../services/errorLogService";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログを自動送信
    const enhancedError = new Error(error.message);
    enhancedError.stack = error.stack + "\n\nComponent Stack:" + errorInfo.componentStack;

    errorLogService.logError(enhancedError);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message}>
            アプリの動作中にエラーが発生しました。{"\n"}
            エラー情報は自動的に開発チームに送信されました。
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debugInfo}>
              デバッグ情報: {this.state.error.message}
            </Text>
          )}
          <TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
            <Text style={styles.restartButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  debugInfo: {
    fontSize: 12,
    color: "#868e96",
    fontFamily: "monospace",
    marginBottom: 16,
    textAlign: "center",
  },
  restartButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  restartButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

#### 管理者画面実装例

```typescript
// screens/AdminErrorLogsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { errorLogService } from "../services/errorLogService";

export function AdminErrorLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadErrorLogs();
  }, []);

  const loadErrorLogs = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await errorLogService.getAdminLogs(page, pagination.limit);

      if (page === 1) {
        setLogs(response.data);
      } else {
        setLogs(prev => [...prev, ...response.data]);
      }

      setPagination(response.pagination);
    } catch (error) {
      Alert.alert("エラー", "エラーログの取得に失敗しました");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadErrorLogs(1);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      loadErrorLogs(pagination.page + 1);
    }
  };

  const renderErrorLog = ({ item }) => (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => showErrorDetails(item)}
    >
      <View style={styles.logHeader}>
        <Text style={styles.logMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.logDate}>
          {new Date(item.timestamp).toLocaleString('ja-JP')}
        </Text>
      </View>

      {item.url && (
        <Text style={styles.logUrl} numberOfLines={1}>
          📍 {item.url}
        </Text>
      )}

      {item.userAgent && (
        <Text style={styles.logUserAgent} numberOfLines={1}>
          🖥️ {item.userAgent}
        </Text>
      )}

      <View style={styles.logFooter}>
        <Text style={[
          styles.severityBadge,
          { backgroundColor: getSeverityColor(item.message) }
        ]}>
          {getSeverityLabel(item.message)}
        </Text>
        <Text style={styles.logId}>ID: {item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  const showErrorDetails = (errorLog) => {
    Alert.alert(
      "エラー詳細",
      `メッセージ: ${errorLog.message}\n\n` +
      `発生時刻: ${new Date(errorLog.timestamp).toLocaleString('ja-JP')}\n\n` +
      `URL: ${errorLog.url || "未知"}\n\n` +
      `スタックトレース:\n${errorLog.stack || "なし"}`,
      [{ text: "閉じる" }]
    );
  };

  const getSeverityColor = (message: string): string => {
    const severity = errorLogService.getErrorSeverity(new Error(message));
    switch (severity) {
      case "low": return "#28a745";
      case "medium": return "#ffc107";
      case "high": return "#fd7e14";
      case "critical": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getSeverityLabel = (message: string): string => {
    const severity = errorLogService.getErrorSeverity(new Error(message));
    switch (severity) {
      case "low": return "軽微";
      case "medium": return "中程度";
      case "high": return "重要";
      case "critical": return "緊急";
      default: return "不明";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>エラーログ管理</Text>
        <Text style={styles.subtitle}>
          総件数: {pagination.total}件
        </Text>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderErrorLog}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>エラーログがありません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  logItem: {
    backgroundColor: "white",
    margin: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logMessage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
    marginRight: 12,
  },
  logDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  logUrl: {
    fontSize: 12,
    color: "#007bff",
    marginBottom: 4,
  },
  logUserAgent: {
    fontSize: 11,
    color: "#868e96",
    marginBottom: 8,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  severityBadge: {
    fontSize: 10,
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  logId: {
    fontSize: 11,
    color: "#adb5bd",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
  },
});
```

---

### セキュリティ・設定

#### ログレベル環境変数

```bash
# .env.local
LOG_LEVEL=error        # 本番環境：エラーのみ
LOG_LEVEL=warn         # ステージング：警告以上
LOG_LEVEL=debug        # 開発環境：すべて
```

#### データ保持・プライバシー

```typescript
// ログ保持期間の設定（将来的な機能）
const LOG_RETENTION_DAYS = 30; // 30日間保持

// 個人情報の除去
function sanitizeErrorData(errorData: ErrorLogRequest): ErrorLogRequest {
  return {
    ...errorData,
    // URLからクエリパラメータを除去
    url: errorData.url?.split("?")[0],
    // スタックトレースから個人情報を除去
    stack: errorData.stack?.replace(/\/Users\/[^\/]+/g, "/Users/***"),
  };
}
```

#### パフォーマンス最適化

```typescript
// バッチ送信による最適化
class ErrorLogBatch {
  private errors: ErrorLogRequest[] = [];
  private maxBatchSize = 10;
  private flushInterval = 30000; // 30秒

  addError(error: ErrorLogRequest) {
    this.errors.push(error);

    if (this.errors.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.errors.length === 0) return;

    const batch = [...this.errors];
    this.errors = [];

    try {
      await errorLogService.sendBatchErrors(batch);
    } catch (error) {
      // 送信失敗時は次回リトライ
      this.errors.unshift(...batch);
    }
  }
}
```

---

## 🎨 Open Graph画像生成・SNSシェア機能API

### 動的OG画像生成

#### エンドポイント詳細

```typescript
// GET /api/og?title={title}&username={username}&tags={tag1,tag2,tag3}
Headers: {
  "Accept": "image/png"
}

// クエリパラメータ
{
  "title": "学習ユニットのタイトル",     // 必須：画像のメインタイトル
  "username": "ユーザー名",            // オプション：サブタイトル
  "tags": "tag1,tag2,tag3"            // オプション：カンマ区切りタグリスト
}
```

#### レスポンス仕様

```typescript
// 成功レスポンス（バイナリ画像データ）
Content-Type: image/png
Content-Length: [image_size_bytes]
Width: 1200px
Height: 630px

// エラーレスポンス
{
  "error": "Failed to generate the image",
  "status": 500
}
```

#### 画像デザイン仕様

```typescript
// デザイン設定
const imageSpecs = {
  dimensions: {
    width: 1200,
    height: 630,
  },
  design: {
    background: "linear-gradient(to bottom right, #ffffff, #f0f7f6)",
    brandColors: {
      primary: "#3B5998", // メインタイトル色
      secondary: "#40B3A2", // サブタイトル・アクセント色
      gradients: "linear-gradient(135deg, #3B5998, #40B3A2)",
    },
    fonts: {
      title: {
        size: "40-48px", // 文字数に応じて自動調整
        weight: "bold",
        lineHeight: 1.4,
      },
      subtitle: {
        size: "24px",
        opacity: 0.9,
      },
      tags: {
        size: "18px",
        background: "gradient",
        padding: "8px 16px",
      },
    },
    layout: {
      logo: "左上にブランドロゴ",
      decorativeElements: "右上に装飾グラデーション",
      contentArea: "中央に配置、最大幅90%",
      tagsArea: "下部にタグバッジ表示",
    },
  },
};
```

#### 使用例（URL）

```typescript
// 基本的な使用例
const ogImageUrls = [
  // 学習ユニット向け
  "/api/og?title=React%E5%9F%BA%E7%A4%8E%E5%AD%A6%E7%BF%92&username=%E5%B1%B1%E7%94%B0%E5%A4%AA%E9%83%8E&tags=React,JavaScript,%E5%89%8D%E7%AB%AF%E9%96%8B%E7%99%BA",

  // ユーザープロフィール向け
  "/api/og?title=%E5%B1%B1%E7%94%B0%E5%A4%AA%E9%83%8E&username=%E3%83%97%E3%83%AD%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB&tags=Web%E9%96%8B%E7%99%BA,%E6%A9%9F%E6%A2%B0%E5%AD%A6%E7%BF%92",

  // サイト全体向け
  "/api/og?title=Learning%20Journal&username=%E5%AD%A6%E7%BF%92%E8%A8%98%E9%8C%B2%E3%83%BB%E6%8C%AF%E3%82%8A%E8%BF%94%E3%82%8A%E3%82%A2%E3%83%97%E3%83%AA&tags=%E5%AD%A6%E7%BF%92%E8%A8%98%E9%8C%B2,%E6%8C%AF%E3%82%8A%E8%BF%94%E3%82%8A,%E5%AD%A6%E7%BF%92%E7%AE%A1%E7%90%86",
];
```

#### 機能詳細

- ✅ **動的生成**: Next.js ImageResponse APIによる高速生成
- ✅ **レスポンシブデザイン**: タイトル長に応じたフォントサイズ自動調整
- ✅ **ブランディング**: 統一されたビジュアルアイデンティティ
- ✅ **タグ表示**: カンマ区切りタグの美しいバッジ表示
- ✅ **キャッシュ最適化**: 画像生成結果のキャッシュ
- ✅ **エラーハンドリング**: 生成失敗時の適切なエラーレスポンス

---

### 個別ユニット用画像生成

#### Opengraph-image機能

```typescript
// /units/[id]/opengraph-image (Next.js App Router自動認識)
// 個別ユニットページ専用のOG画像を自動生成

// 生成される画像の特徴
const unitImageFeatures = {
  dataSource: "ユニット詳細API (/api/units/[id]) から自動取得",
  dynamicContent: {
    title: "ユニットタイトル（長い場合は省略）",
    learningGoal: "学習目標（存在する場合）",
    userInfo: {
      name: "ユーザー名",
      avatar: "プロフィール画像（デフォルト画像対応）",
    },
  },
  design: {
    layout: "ヘッダー + メインコンテンツ + ユーザー情報フッター",
    userSection: "アバター画像 + ユーザー名 + ブランド名",
    errorHandling: "ユニット未発見時の適切な画像表示",
  },
};
```

---

### SNSメタデータ統合

#### メタデータ自動生成

```typescript
// 各ページで自動生成されるメタデータ
interface MetadataIntegration {
  openGraph: {
    title: string;
    description: string;
    type: "website" | "article";
    url: string;
    siteName: "Learning Journal";
    locale: "ja_JP";
    images: Array<{
      url: string; // /api/og または opengraph-image
      width: 1200;
      height: 630;
      alt: string;
    }>;
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    creator?: string; // ユーザー名
    images: string[]; // OG画像と同じURL
  };
}
```

#### 実装されているページ

```typescript
// メタデータが実装されているページ一覧
const pagesWithOGSupport = [
  {
    path: "/",
    ogImage:
      "/api/og?title=Learning Journal&username=学習記録・振り返りアプリ&tags=学習記録,振り返り,学習管理,ポートフォリオ",
    metadata: "サイト全体の紹介",
  },
  {
    path: "/units",
    ogImage:
      "/api/og?title=学習ユニット一覧&username=Learning Journal&tags=学習記録,振り返り,学習管理",
    metadata: "ユニット一覧ページ",
  },
  {
    path: "/units/[id]",
    ogImage: "opengraph-image.tsx（動的生成）",
    metadata: "個別ユニット詳細",
  },
  {
    path: "/users/[id]",
    ogImage:
      "/api/og?title={userName}&username=プロフィール&tags={interestTags}",
    metadata: "ユーザープロフィール",
  },
];
```

---

### React Native実装例

```typescript
// services/shareService.ts
interface ShareContent {
  title: string;
  url: string;
  message?: string;
  imageUrl?: string;
}

interface OGImageParams {
  title: string;
  username?: string;
  tags?: string[];
}

class ShareService {
  private baseURL = "https://learning-journal.vercel.app";

  // OG画像URL生成
  generateOGImageUrl(params: OGImageParams): string {
    const searchParams = new URLSearchParams();
    searchParams.set("title", params.title);

    if (params.username) {
      searchParams.set("username", params.username);
    }

    if (params.tags && params.tags.length > 0) {
      searchParams.set("tags", params.tags.join(","));
    }

    // キャッシュバスター追加（必要に応じて）
    searchParams.set("t", Date.now().toString());

    return `${this.baseURL}/api/og?${searchParams.toString()}`;
  }

  // ユニット用シェアコンテンツ生成
  generateUnitShareContent(unit: Unit): ShareContent {
    const title = `${unit.title} | Learning Journal`;
    const url = `${this.baseURL}/units/${unit.id}`;
    const message = `${unit.title}の学習記録を共有しました！\n\n目標: ${unit.learningGoal || "継続的な学習"}`;

    const ogImageUrl = this.generateOGImageUrl({
      title: unit.title,
      username: unit.user.name || "ユーザー",
      tags: unit.tags?.map((tag) => tag.name) || [],
    });

    return { title, url, message, imageUrl: ogImageUrl };
  }

  // ユーザープロフィール用シェアコンテンツ生成
  generateUserShareContent(user: User): ShareContent {
    const title = `${user.name}のプロフィール | Learning Journal`;
    const url = `${this.baseURL}/users/${user.id}`;
    const message = `${user.name}さんの学習記録をチェックしよう！`;

    const ogImageUrl = this.generateOGImageUrl({
      title: user.name || "Learning Journalユーザー",
      username: "プロフィール",
      tags: user.interests?.map((interest) => interest.name) || [],
    });

    return { title, url, message, imageUrl: ogImageUrl };
  }

  // ネイティブシェア機能
  async shareContent(content: ShareContent): Promise<boolean> {
    try {
      if (Platform.OS === "ios" || Platform.OS === "android") {
        const { Share } = await import("react-native");

        const result = await Share.share({
          title: content.title,
          message: `${content.message}\n\n${content.url}`,
          url: content.url, // iOS
        });

        return result.action === Share.sharedAction;
      } else {
        // Web fallback
        if (navigator.share) {
          await navigator.share({
            title: content.title,
            text: content.message,
            url: content.url,
          });
          return true;
        } else {
          // クリップボードコピー
          await navigator.clipboard.writeText(
            `${content.message}\n\n${content.url}`
          );
          return true;
        }
      }
    } catch (error) {
      console.error("シェアエラー:", error);
      return false;
    }
  }

  // SNS別シェアURL生成
  generateSNSShareUrls(content: ShareContent) {
    const encodedTitle = encodeURIComponent(content.title);
    const encodedMessage = encodeURIComponent(content.message || content.title);
    const encodedUrl = encodeURIComponent(content.url);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedMessage}`,
      // React Native専用
      whatsapp: `whatsapp://send?text=${encodedMessage} ${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
    };
  }

  // OG画像をローカルに保存（オプション）
  async downloadOGImage(
    imageUrl: string,
    filename: string
  ): Promise<string | null> {
    try {
      const { FileSystem, MediaLibrary } = await import("expo-file-system");

      // 画像をダウンロード
      const downloadResult = await FileSystem.downloadAsync(
        imageUrl,
        `${FileSystem.documentDirectory}${filename}.png`
      );

      if (downloadResult.status === 200) {
        // メディアライブラリに保存（権限が必要）
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        return asset.uri;
      }

      return null;
    } catch (error) {
      console.error("OG画像ダウンロードエラー:", error);
      return null;
    }
  }
}

export const shareService = new ShareService();
```

#### 使用例（React Native）

```typescript
// components/ShareButton.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { shareService } from "../services/shareService";

interface ShareButtonProps {
  content: {
    type: "unit" | "user" | "general";
    data: Unit | User | { title: string; description: string };
  };
}

export function ShareButton({ content }: ShareButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [shareContent, setShareContent] = useState<any>(null);

  const handleSharePress = () => {
    let generatedContent;

    switch (content.type) {
      case "unit":
        generatedContent = shareService.generateUnitShareContent(content.data as Unit);
        break;
      case "user":
        generatedContent = shareService.generateUserShareContent(content.data as User);
        break;
      default:
        generatedContent = {
          title: content.data.title,
          url: "https://learning-journal.vercel.app",
          message: content.data.description,
        };
    }

    setShareContent(generatedContent);
    setModalVisible(true);
  };

  const handleNativeShare = async () => {
    if (!shareContent) return;

    const success = await shareService.shareContent(shareContent);
    if (success) {
      setModalVisible(false);
    } else {
      Alert.alert("エラー", "シェアに失敗しました");
    }
  };

  const handleSNSShare = (platform: string) => {
    if (!shareContent) return;

    const snsUrls = shareService.generateSNSShareUrls(shareContent);
    const url = snsUrls[platform];

    if (url) {
      Linking.openURL(url).catch((error) => {
        console.error(`${platform}でのシェアに失敗:`, error);
        Alert.alert("エラー", "アプリを開けませんでした");
      });
    }

    setModalVisible(false);
  };

  const handleCopyLink = async () => {
    if (!shareContent) return;

    try {
      const { Clipboard } = await import('@react-native-clipboard/clipboard');
      await Clipboard.setString(`${shareContent.message}\n\n${shareContent.url}`);
      Alert.alert("成功", "リンクをクリップボードにコピーしました");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("エラー", "クリップボードへのコピーに失敗しました");
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
        <Text style={styles.shareButtonText}>📤 シェア</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>シェア</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {shareContent && (
              <ScrollView style={styles.shareOptions}>
                {/* ネイティブシェア */}
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={handleNativeShare}
                >
                  <Text style={styles.shareOptionIcon}>📱</Text>
                  <Text style={styles.shareOptionText}>デバイス標準シェア</Text>
                </TouchableOpacity>

                {/* SNSシェアオプション */}
                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleSNSShare("twitter")}
                >
                  <Text style={styles.shareOptionIcon}>🐦</Text>
                  <Text style={styles.shareOptionText}>Twitter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleSNSShare("facebook")}
                >
                  <Text style={styles.shareOptionIcon}>📘</Text>
                  <Text style={styles.shareOptionText}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleSNSShare("linkedin")}
                >
                  <Text style={styles.shareOptionIcon}>💼</Text>
                  <Text style={styles.shareOptionText}>LinkedIn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleSNSShare("line")}
                >
                  <Text style={styles.shareOptionIcon}>💬</Text>
                  <Text style={styles.shareOptionText}>LINE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareOption}
                  onPress={() => handleSNSShare("whatsapp")}
                >
                  <Text style={styles.shareOptionIcon}>📞</Text>
                  <Text style={styles.shareOptionText}>WhatsApp</Text>
                </TouchableOpacity>

                {/* リンクコピー */}
                <TouchableOpacity
                  style={[styles.shareOption, styles.copyOption]}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.shareOptionIcon}>🔗</Text>
                  <Text style={styles.shareOptionText}>リンクをコピー</Text>
                </TouchableOpacity>

                {/* プレビュー */}
                <View style={styles.previewContainer}>
                  <Text style={styles.previewTitle}>プレビュー</Text>
                  <View style={styles.previewContent}>
                    <Text style={styles.previewText}>{shareContent.title}</Text>
                    <Text style={styles.previewMessage}>{shareContent.message}</Text>
                    <Text style={styles.previewUrl}>{shareContent.url}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  shareButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6c757d",
  },
  shareOptions: {
    padding: 20,
  },
  shareOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  shareOptionIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 30,
    textAlign: "center",
  },
  shareOptionText: {
    fontSize: 16,
    color: "#212529",
    flex: 1,
  },
  copyOption: {
    borderBottomWidth: 2,
    borderBottomColor: "#dee2e6",
    marginBottom: 16,
  },
  previewContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  previewContent: {
    gap: 4,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  previewMessage: {
    fontSize: 12,
    color: "#6c757d",
    lineHeight: 18,
  },
  previewUrl: {
    fontSize: 11,
    color: "#007bff",
    fontStyle: "italic",
  },
});
```

---

### PWAマニフェスト統合

#### アプリマニフェスト仕様

```json
// public/manifest.json - PWA対応
{
  "name": "Learning Journal",
  "short_name": "LearningJournal",
  "description": "学習の記録と振り返りができる学習管理アプリ",
  "icons": [
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/favicon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot1.png",
      "type": "image/png",
      "sizes": "540x720",
      "form_factor": "narrow"
    }
  ],
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "categories": ["education", "productivity"]
}
```

#### キャッシュ戦略

```typescript
// next.config.js でのキャッシュ設定
const cacheHeaders = {
  // OG画像のキャッシュ
  "/api/og": "public, max-age=86400, stale-while-revalidate=604800",
  // 静的アセット
  "/_next/static": "public, max-age=31536000, immutable",
  // アイコン類
  "/favicon": "public, max-age=31536000, immutable",
  // マニフェスト
  "/manifest.json": "public, max-age=86400, stale-while-revalidate=604800",
};
```

---

### 📱 推奨画像サイズ・SEO最適化

#### プラットフォーム別推奨サイズ

```typescript
const recommendedSizes = {
  openGraph: {
    general: "1200x630px",
    facebook: "1200x630px",
    twitter: "1200x675px",
    linkedin: "1200x627px",
  },
  socialMedia: {
    instagram: "1080x1080px",
    twitterPost: "1200x675px",
    blogHeader: "1200x400px",
    github: "1280x640px",
  },
  pwa: {
    icon192: "192x192px",
    icon512: "512x512px",
    splash: "540x720px (narrow), 720x540px (wide)",
  },
};
```

#### SEO最適化項目

```typescript
interface SEOOptimization {
  metaTags: {
    title: "ページ固有タイトル | Learning Journal";
    description: "120-160文字の説明文";
    keywords: string[];
    author: string;
    robots: "index,follow";
    canonical: string;
  };
  openGraph: {
    type: "website" | "article";
    locale: "ja_JP";
    siteName: "Learning Journal";
    images: "1200x630px OG画像";
  };
  twitter: {
    card: "summary_large_image";
    site: "@learning_journal";
    creator: "@username";
  };
  structured: {
    "@type": "Article" | "ProfilePage" | "WebSite";
    author: object;
    publisher: object;
    datePublished: string;
    dateModified: string;
  };
}
```

---

## 📬 Resendメール設定・診断API

### Resendサービス設定情報取得

#### エンドポイント詳細

```typescript
// GET /api/resend-info
Headers: {
  // 認証不要 - サーバー管理者向け内部API
}

// パラメータ不要（サーバー環境から自動取得）
```

#### レスポンス

```typescript
// 成功レスポンス
{
  "status": "success",
  "resendInfo": {
    "domains": [
      {
        "id": "domain_id_123",
        "name": "learning-journal-app.com",
        "status": "verified",
        "created_at": "2024-01-01T00:00:00.000Z",
        "dns_provider": "Cloudflare",
        "region": "us-east-1"
      }
    ],
    "apiKeyValid": true,
    "apiKeyInfo": {
      "name": "Production Key",
      "created_at": "2024-01-01T00:00:00.000Z",
      "permissions": ["domain:create", "email:send"],
      "domain_id": "domain_id_123"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// APIキー未設定エラー
{
  "error": "RESEND_API_KEY が設定されていません",
  "status": 400
}

// サーバーエラー
{
  "status": "error",
  "error": "Failed to fetch domain information",
  "details": {
    "code": "RESEND_API_ERROR",
    "message": "Invalid API key"
  }
}
```

#### 機能詳細

**📋 取得情報**

- **ドメイン設定**: 確認済みドメイン一覧、DNS設定状況
- **APIキー状況**: 有効性チェック、権限確認、作成日時
- **サービス状況**: Resend APIの接続状況
- **地域設定**: メール送信リージョン情報

**🔧 診断項目**

- ✅ **APIキー有効性**: 環境変数設定確認
- ✅ **ドメイン認証**: DNS設定・DKIM認証状況
- ✅ **権限確認**: メール送信・ドメイン管理権限
- ✅ **接続テスト**: Resend APIへの接続性
- ✅ **設定検証**: 送信者ドメインの整合性

#### セキュリティ・アクセス制御

- ✅ **内部API**: 管理者・開発者専用（認証不要）
- ✅ **機密情報保護**: APIキーの完全な値は非表示
- ✅ **ログ記録**: アクセス状況をサーバーログに記録
- ✅ **エラーハンドリング**: 詳細なエラー情報でトラブルシューティング支援

#### 関連メール機能

**🎯 実装済みメール機能**

1. **認証関連メール**

   - メールアドレス確認（新規登録時）
   - メール確認再送信機能
   - パスワードリセット通知

2. **お問い合わせシステム**

   - 管理者への通知メール
   - 顧客への自動返信メール
   - カテゴリ別メール振り分け

3. **サブスクリプション通知**

   - 支払い成功・失敗通知
   - プラン期間終了前警告
   - サブスクリプション更新・キャンセル通知
   - トライアル期間関連通知

4. **テスト・診断メール**
   - システムテストメール送信
   - 設定確認用メール
   - 環境別メール送信テスト

#### 環境変数依存関係

```typescript
// 必要な環境変数
interface RequiredEnvVars {
  RESEND_API_KEY: string; // 必須: Resend APIキー
  ADMIN_EMAIL?: string; // オプション: 管理者メールアドレス
  SUPPORT_EMAIL?: string; // オプション: サポートメールアドレス
  NEXT_PUBLIC_APP_URL?: string; // オプション: アプリケーションURL
}

// Resendメール送信設定
const EMAIL_CONFIG = {
  from: "Learning Journal <noreply@learning-journal-app.com>",
  replyTo: process.env.SUPPORT_EMAIL || "noreply@learning-journal-app.com",
  domains: ["learning-journal-app.com"],
  region: "us-east-1",
};
```

#### React Native実装例

```typescript
// services/resendInfoService.ts
interface ResendDomain {
  id: string;
  name: string;
  status: "verified" | "pending" | "failed";
  created_at: string;
  dns_provider?: string;
  region?: string;
}

interface ResendApiKeyInfo {
  name: string;
  created_at: string;
  permissions: string[];
  domain_id?: string;
}

interface ResendInfoResponse {
  status: "success" | "error";
  resendInfo?: {
    domains: ResendDomain[];
    apiKeyValid: boolean;
    apiKeyInfo?: ResendApiKeyInfo;
  };
  error?: string;
  details?: any;
  timestamp: string;
}

class ResendInfoService {
  private baseURL = "https://learning-journal.vercel.app";

  async getResendInfo(): Promise<ResendInfoResponse> {
    const response = await fetch(`${this.baseURL}/api/resend-info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 認証ヘッダー不要（内部API）
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ResendInfoError(
        errorData.error || "Resend情報の取得に失敗しました",
        response.status,
        errorData.details
      );
    }

    return response.json();
  }

  // ドメイン設定状況チェック
  async checkDomainStatus(): Promise<{
    verified: ResendDomain[];
    pending: ResendDomain[];
    failed: ResendDomain[];
  }> {
    const resendInfo = await this.getResendInfo();

    if (resendInfo.status !== "success" || !resendInfo.resendInfo) {
      throw new Error("Resend情報の取得に失敗しました");
    }

    const domains = resendInfo.resendInfo.domains;

    return {
      verified: domains.filter((d) => d.status === "verified"),
      pending: domains.filter((d) => d.status === "pending"),
      failed: domains.filter((d) => d.status === "failed"),
    };
  }

  // メール送信可能性チェック
  async validateEmailConfiguration(): Promise<{
    canSendEmail: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const resendInfo = await this.getResendInfo();

      if (resendInfo.status !== "success") {
        issues.push("Resend API接続エラー");
        recommendations.push("RESEND_API_KEYの設定を確認してください");
        return { canSendEmail: false, issues, recommendations };
      }

      if (!resendInfo.resendInfo?.apiKeyValid) {
        issues.push("APIキーが無効または未設定");
        recommendations.push("有効なResend APIキーを設定してください");
      }

      const verifiedDomains =
        resendInfo.resendInfo?.domains?.filter(
          (d) => d.status === "verified"
        ) || [];

      if (verifiedDomains.length === 0) {
        issues.push("確認済みドメインが存在しません");
        recommendations.push(
          "Resendダッシュボードでドメインを追加・確認してください"
        );
      }

      const canSendEmail = issues.length === 0;

      if (canSendEmail) {
        recommendations.push("メール送信設定は正常です");
      }

      return { canSendEmail, issues, recommendations };
    } catch (error) {
      issues.push("設定確認中にエラーが発生しました");
      recommendations.push("ネットワーク接続とAPI設定を確認してください");
      return { canSendEmail: false, issues, recommendations };
    }
  }

  // ドメイン別送信可能メールタイプ
  getDomainCapabilities(domain: ResendDomain): {
    canSendTransactional: boolean;
    canSendMarketing: boolean;
    recommendedUsage: string[];
  } {
    const isVerified = domain.status === "verified";

    return {
      canSendTransactional: isVerified,
      canSendMarketing: isVerified,
      recommendedUsage: isVerified
        ? ["認証メール", "通知メール", "お問い合わせ返信", "システム通知"]
        : ["設定完了後に利用可能"],
    };
  }

  // 診断レポート生成
  async generateDiagnosticReport(): Promise<{
    summary: string;
    details: {
      apiStatus: string;
      domainCount: number;
      verifiedDomains: number;
      lastCheck: string;
    };
    issues: string[];
    actions: string[];
  }> {
    try {
      const resendInfo = await this.getResendInfo();
      const domainStatus = await this.checkDomainStatus();
      const validation = await this.validateEmailConfiguration();

      const details = {
        apiStatus: resendInfo.resendInfo?.apiKeyValid ? "有効" : "無効",
        domainCount: resendInfo.resendInfo?.domains?.length || 0,
        verifiedDomains: domainStatus.verified.length,
        lastCheck: new Date().toLocaleString("ja-JP"),
      };

      const summary = validation.canSendEmail
        ? "✅ メール送信設定は正常に動作しています"
        : "⚠️ メール送信に問題があります";

      return {
        summary,
        details,
        issues: validation.issues,
        actions: validation.recommendations,
      };
    } catch (error) {
      return {
        summary: "❌ 診断実行中にエラーが発生しました",
        details: {
          apiStatus: "不明",
          domainCount: 0,
          verifiedDomains: 0,
          lastCheck: new Date().toLocaleString("ja-JP"),
        },
        issues: ["診断APIの実行に失敗しました"],
        actions: ["ネットワーク接続とサーバー状況を確認してください"],
      };
    }
  }
}

export const resendInfoService = new ResendInfoService();

// カスタムエラークラス
export class ResendInfoError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number = 500, details?: any) {
    super(message);
    this.name = "ResendInfoError";
    this.status = status;
    this.details = details;
  }
}
```

#### 使用例（React Native）

```typescript
// components/EmailConfigurationDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { resendInfoService, ResendInfoError } from "../services/resendInfoService";

export function EmailConfigurationDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);
  const [resendInfo, setResendInfo] = useState<any>(null);

  useEffect(() => {
    loadEmailConfiguration();
  }, []);

  const loadEmailConfiguration = async () => {
    try {
      setLoading(true);
      const [report, info] = await Promise.all([
        resendInfoService.generateDiagnosticReport(),
        resendInfoService.getResendInfo(),
      ]);

      setDiagnosticReport(report);
      setResendInfo(info);
    } catch (error) {
      console.error("メール設定読み込みエラー:", error);
      Alert.alert("エラー", "メール設定情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmailConfiguration();
    setRefreshing(false);
  };

  const handleDomainCheck = async () => {
    try {
      const validation = await resendInfoService.validateEmailConfiguration();

      Alert.alert(
        "設定確認結果",
        validation.canSendEmail
          ? "✅ メール送信設定は正常です"
          : `⚠️ 問題が見つかりました:\n${validation.issues.join('\n')}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("エラー", "設定確認中にエラーが発生しました");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>メール設定を確認中...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>メール設定ダッシュボード</Text>
        <Text style={styles.subtitle}>Resend メールサービス設定状況</Text>
      </View>

      {/* 診断サマリー */}
      {diagnosticReport && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>設定状況</Text>
          <Text style={[
            styles.summaryText,
            { color: diagnosticReport.summary.includes('✅') ? '#28a745' : '#dc3545' }
          ]}>
            {diagnosticReport.summary}
          </Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>API状況</Text>
              <Text style={[
                styles.detailValue,
                { color: diagnosticReport.details.apiStatus === '有効' ? '#28a745' : '#dc3545' }
              ]}>
                {diagnosticReport.details.apiStatus}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>確認済みドメイン</Text>
              <Text style={styles.detailValue}>
                {diagnosticReport.details.verifiedDomains} / {diagnosticReport.details.domainCount}
              </Text>
            </View>
          </View>

          <Text style={styles.lastCheck}>
            最終確認: {diagnosticReport.details.lastCheck}
          </Text>
        </View>
      )}

      {/* ドメイン情報 */}
      {resendInfo?.resendInfo?.domains && (
        <View style={styles.domainsCard}>
          <Text style={styles.cardTitle}>ドメイン設定</Text>
          {resendInfo.resendInfo.domains.map((domain, index) => (
            <DomainCard key={domain.id || index} domain={domain} />
          ))}
        </View>
      )}

      {/* 問題・推奨事項 */}
      {diagnosticReport?.issues?.length > 0 && (
        <View style={styles.issuesCard}>
          <Text style={styles.cardTitle}>⚠️ 検出された問題</Text>
          {diagnosticReport.issues.map((issue, index) => (
            <Text key={index} style={styles.issueText}>• {issue}</Text>
          ))}
        </View>
      )}

      {diagnosticReport?.actions?.length > 0 && (
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>💡 推奨事項</Text>
          {diagnosticReport.actions.map((action, index) => (
            <Text key={index} style={styles.actionText}>• {action}</Text>
          ))}
        </View>
      )}

      {/* アクションボタン */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.checkButton} onPress={handleDomainCheck}>
          <Text style={styles.buttonText}>🔍 設定確認</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.buttonText}>🔄 情報更新</Text>
        </TouchableOpacity>
      </View>

      {/* APIキー情報 */}
      {resendInfo?.resendInfo?.apiKeyInfo && (
        <View style={styles.apiKeyCard}>
          <Text style={styles.cardTitle}>APIキー情報</Text>
          <View style={styles.apiKeyDetails}>
            <Text style={styles.apiKeyLabel}>名前: {resendInfo.resendInfo.apiKeyInfo.name}</Text>
            <Text style={styles.apiKeyLabel}>
              作成日: {new Date(resendInfo.resendInfo.apiKeyInfo.created_at).toLocaleDateString('ja-JP')}
            </Text>
            <Text style={styles.apiKeyLabel}>
              権限: {resendInfo.resendInfo.apiKeyInfo.permissions?.join(', ') || '不明'}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ドメインカードコンポーネント
function DomainCard({ domain }) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "verified": return "#28a745";
      case "pending": return "#ffc107";
      case "failed": return "#dc3545";
      default: return "#6c757d";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "verified": return "✅ 確認済み";
      case "pending": return "⏳ 確認中";
      case "failed": return "❌ 失敗";
      default: return "❓ 不明";
    }
  };

  const capabilities = resendInfoService.getDomainCapabilities(domain);

  return (
    <View style={styles.domainCard}>
      <View style={styles.domainHeader}>
        <Text style={styles.domainName}>{domain.name}</Text>
        <Text style={[
          styles.domainStatus,
          { color: getStatusColor(domain.status) }
        ]}>
          {getStatusText(domain.status)}
        </Text>
      </View>

      {domain.dns_provider && (
        <Text style={styles.domainInfo}>
          DNS: {domain.dns_provider} | Region: {domain.region || 'us-east-1'}
        </Text>
      )}

      <View style={styles.capabilitiesContainer}>
        <Text style={styles.capabilitiesTitle}>利用可能機能:</Text>
        {capabilities.recommendedUsage.map((usage, index) => (
          <Text key={index} style={styles.usageText}>• {usage}</Text>
        ))}
      </View>

      <Text style={styles.domainDate}>
        作成日: {new Date(domain.created_at).toLocaleDateString('ja-JP')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6c757d",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  lastCheck: {
    fontSize: 12,
    color: "#868e96",
    fontStyle: "italic",
  },
  domainsCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  domainCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  domainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  domainName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  domainStatus: {
    fontSize: 14,
    fontWeight: "600",
  },
  domainInfo: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 8,
  },
  capabilitiesContainer: {
    marginBottom: 8,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  usageText: {
    fontSize: 12,
    color: "#6c757d",
    marginLeft: 8,
  },
  domainDate: {
    fontSize: 11,
    color: "#868e96",
  },
  issuesCard: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  actionsCard: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    borderWidth: 1,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  issueText: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: "#155724",
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    margin: 16,
    gap: 12,
  },
  checkButton: {
    flex: 1,
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  refreshButton: {
    flex: 1,
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  apiKeyCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  apiKeyDetails: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  apiKeyLabel: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 4,
  },
});
```

---

## 💳 Stripe決済・サブスクリプション管理API

### チェックアウトセッション作成

#### エンドポイント詳細

```typescript
// POST /api/stripe/create-checkout-session
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer [access_token]"  // 認証必須
}

Request: {
  "planId": "PRO"  // プラン識別子
}
```

#### レスポンス仕様

```typescript
// 成功レスポンス
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/pay/cs_test_...",
    "sessionId": "cs_test_a1b2c3d4e5f6..."
  }
}

// トライアル適用時のログ
// Console: "✅ Trial applied: 7 days free trial"
// Console: "❌ Trial not applied: User has already used trial"

// エラーレスポンス
{
  "error": "認証が必要です",
  "status": 401
}

{
  "error": "無効なプランです",
  "status": 400
}
```

#### 重要な機能特徴

```typescript
// トライアル利用履歴チェック
const hasUsedTrial = user.trialEnd !== null;

// チェックアウトセッション作成
const checkoutSession = await createCheckoutSession({
  customerId,
  priceId: plan.stripePriceId,
  successUrl: `/dashboard?success=true&plan=${planId}`,
  cancelUrl: `/pricing?canceled=true`,
  metadata: { userId: user.id, planId },
  trialEligible: !hasUsedTrial,  // 重要：トライアル再利用防止
});

// Stripe設定
subscription_data: {
  trial_period_days: trialEligible ? 7 : undefined,
  metadata: { userId, planId }
}
```

### カスタマーポータルセッション作成

#### エンドポイント詳細

```typescript
// POST /api/stripe/create-portal-session
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer [access_token]"  // 認証必須
}

// リクエストボディ不要（セッションからユーザー特定）
```

#### レスポンス仕様

```typescript
// 成功レスポンス
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/p_session_...",
    "sessionId": "ps_..."
  }
}

// 利用可能な機能：
// - サブスクリプション管理（解約・再開）
// - 支払い方法変更
// - 請求履歴表示
// - プラン変更（設定に応じて）
```

### Stripeウェブフック処理システム

#### エンドポイント詳細

```typescript
// POST /api/stripe/webhook
Headers: {
  "stripe-signature": "t=...,v1=...",  // Stripe署名検証
  "Content-Type": "application/json"
}

// 処理可能なイベント一覧
const eventHandlers = {
  "checkout.session.completed": handleCheckoutCompleted,
  "customer.subscription.updated": handleSubscriptionChange,
  "customer.subscription.deleted": handleSubscriptionDeleted,
  "invoice.payment_succeeded": handlePaymentSucceeded,
  "invoice.payment_failed": handlePaymentFailed,
  "invoice.upcoming": handleUpcomingInvoice,
  "customer.subscription.trial_will_end": handleTrialWillEnd,
};
```

#### 主要処理フロー

```typescript
// 1. チェックアウト完了処理
async function handleCheckoutCompleted(session) {
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription
  );

  // トライアル期間の日付計算
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;
  const subscriptionEndDate =
    subscription.status === "trialing" && trialEnd ? trialEnd : periodEnd;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: subscription.status, // "trialing" or "active"
      subscriptionPlan: "pro",
      subscriptionStart: periodStart,
      subscriptionEnd: subscriptionEndDate,
      trialEnd: trialEnd,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
    },
  });

  // トライアル開始ウェルカムメール
  if (subscription.status === "trialing" && trialEnd) {
    await sendTrialStartedWelcome(user.email, user.name, trialEnd);
  }
}

// 2. サブスクリプション変更処理
async function handleSubscriptionChange(subscription) {
  const shouldDeactivate =
    subscription.cancel_at_period_end && periodEnd <= now;

  await prisma.user.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      subscriptionStatus: shouldDeactivate ? "canceled" : subscription.status,
      subscriptionPlan: isCurrentlyValid ? "pro" : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.cancel_at_period_end
        ? subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : new Date()
        : null,
    },
  });

  // キャンセル通知メール
  if (subscription.cancel_at_period_end && !shouldDeactivate) {
    await sendSubscriptionCancelledNotification(
      user.email,
      user.name,
      periodEnd
    );
  }
}

// 3. 決済成功・失敗処理
async function handlePaymentSucceeded(invoice) {
  if (invoice.amount_paid > 0) {
    await sendPaymentSucceededNotification(
      user.email,
      user.name,
      invoice.amount_paid,
      invoice.hosted_invoice_url
    );
  }
}

async function handlePaymentFailed(invoice) {
  await prisma.user.update({
    where: { stripeCustomerId: invoice.customer },
    data: { subscriptionStatus: "past_due" },
  });

  await sendPaymentFailedNotification(
    user.email,
    user.name,
    invoice.amount_due
  );
}

// 4. トライアル終了警告
async function handleTrialWillEnd(subscription) {
  const trialEndDate = new Date(subscription.current_period_end * 1000);
  const daysUntilEnd = Math.ceil(
    (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  await sendTrialEndingWarning(
    user.email,
    user.name,
    Math.max(1, daysUntilEnd),
    trialEndDate
  );
}
```

### Stripe環境設定チェック

#### エンドポイント詳細

```typescript
// GET /api/stripe/environment-check
// 認証不要 - 開発・デバッグ用

// レスポンス例
{
  "success": true,
  "data": {
    "status": "OK",  // "OK" | "WARNING" | "ERROR"
    "environment": {
      "NODE_ENV": "production",
      "isProduction": true,
      "hasAllStripeKeys": true
    },
    "envCheck": {
      "STRIPE_SECRET_KEY": {
        "exists": true,
        "type": "LIVE",  // "LIVE" | "TEST" | "UNKNOWN"
        "masked": "sk_live_...fG8k"
      },
      "STRIPE_PUBLISHABLE_KEY": {
        "exists": true,
        "type": "LIVE",
        "masked": "pk_live_...jH2m"
      },
      "STRIPE_WEBHOOK_SECRET": {
        "exists": true,
        "type": "VALID_FORMAT",
        "masked": "whsec_..."
      },
      "STRIPE_PRO_PRICE_ID": {
        "exists": true,
        "type": "VALID_FORMAT",
        "masked": "price_..."
      }
    },
    "consistencyCheck": {
      "keysMatchEnvironment": true,
      "expectedKeyType": "LIVE",
      "actualKeyType": "LIVE",
      "isConsistent": true
    },
    "warnings": [],
    "errors": [],
    "recommendations": [
      "本番環境移行前にすべての環境変数を確認してください",
      "テスト環境と本番環境でキーが正しく設定されているか確認してください"
    ]
  }
}
```

### Stripe顧客情報デバッグ

#### エンドポイント詳細

```typescript
// GET /api/stripe/debug-customer
Headers: {
  "Authorization": "Bearer [access_token]"  // 認証必須
}

// デバッグ情報レスポンス
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "environment": "production",
    "stripeEnvironment": "live",  // "live" | "test"
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "stripeCustomerId": "cus_...",
      "subscriptionStatus": "active",
      "subscriptionPlan": "pro"
    },
    "stripeCustomer": {
      "id": "cus_...",
      "email": "user@example.com",
      "created": "2024-01-01T00:00:00.000Z",
      "deleted": false
    },
    "stripeError": null,
    "hasStripeAccess": true
  }
}
```

### React Native StripeServiceクラス

```typescript
class StripeService {
  private baseUrl: string;
  private authService: AuthService;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
    this.authService = new AuthService();
  }

  // チェックアウトセッション作成
  async createCheckoutSession(
    planId: string
  ): Promise<{ url: string; sessionId: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await this.authService.getAuthHeaders()),
          },
          body: JSON.stringify({ planId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "チェックアウトセッションの作成に失敗しました"
        );
      }

      return data.data;
    } catch (error) {
      console.error("Create checkout session error:", error);
      throw error;
    }
  }

  // カスタマーポータルセッション作成
  async createPortalSession(): Promise<{ url: string; sessionId: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/stripe/create-portal-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await this.authService.getAuthHeaders()),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ポータルセッションの作成に失敗しました");
      }

      return data.data;
    } catch (error) {
      console.error("Create portal session error:", error);
      throw error;
    }
  }

  // Stripe環境チェック
  async checkEnvironment(): Promise<StripeEnvironmentInfo> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/stripe/environment-check`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "環境チェックに失敗しました");
      }

      return data.data;
    } catch (error) {
      console.error("Environment check error:", error);
      throw error;
    }
  }

  // 顧客情報デバッグ
  async debugCustomer(): Promise<StripeCustomerDebugInfo> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/stripe/debug-customer`,
        {
          method: "GET",
          headers: {
            ...(await this.authService.getAuthHeaders()),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "顧客情報の取得に失敗しました");
      }

      return data.data;
    } catch (error) {
      console.error("Debug customer error:", error);
      throw error;
    }
  }
}

interface StripeEnvironmentInfo {
  status: "OK" | "WARNING" | "ERROR";
  environment: {
    NODE_ENV: string;
    isProduction: boolean;
    hasAllStripeKeys: boolean;
  };
  envCheck: {
    STRIPE_SECRET_KEY: {
      exists: boolean;
      type: "LIVE" | "TEST" | "UNKNOWN";
      masked: string | null;
    };
    // 他の環境変数...
  };
  consistencyCheck: {
    keysMatchEnvironment: boolean;
    expectedKeyType: string;
    actualKeyType: string;
    isConsistent: boolean;
  };
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

interface StripeCustomerDebugInfo {
  timestamp: string;
  environment: string;
  stripeEnvironment: "live" | "test";
  user: {
    id: string;
    email: string;
    stripeCustomerId: string | null;
    subscriptionStatus: string | null;
    subscriptionPlan: string | null;
  };
  stripeCustomer: {
    id: string;
    email: string;
    created: string;
    deleted: boolean;
  } | null;
  stripeError: string | null;
  hasStripeAccess: boolean;
}

export default StripeService;
```

### React Native 決済画面コンポーネント

```typescript
import React, { useState } from 'react';
import { View, Text, Alert, Linking } from 'react-native';
import { Button, Card } from 'react-native-elements';
import { WebView } from 'react-native-webview';
import StripeService from '../services/StripeService';

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  features: string[];
  stripePriceId?: string;
}

const PLANS: Record<string, PlanInfo> = {
  FREE: {
    id: 'free',
    name: '無料プラン',
    price: 0,
    features: ['学習ユニット 無制限', '学習ログ 無制限', '基本分析機能'],
  },
  PRO: {
    id: 'pro',
    name: 'プロプラン',
    price: 680,
    features: [
      '学習ユニット 無制限',
      '学習ログ 無制限',
      'AIアドバイス機能 🤖',
      'AI学習サジェスト機能 ✨',
      '7日間無料トライアル',
    ],
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
};

export default function PricingScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const stripeService = new StripeService();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'FREE') {
      Alert.alert('情報', '現在無料プランをご利用中です');
      return;
    }

    setLoading(planId);

    try {
      // チェックアウトセッション作成
      const session = await stripeService.createCheckoutSession(planId);

      // WebViewで表示するか外部ブラウザで開くか選択
      const useWebView = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '決済方法を選択',
          'Stripeの決済画面をどこで表示しますか？',
          [
            { text: 'アプリ内で表示', onPress: () => resolve(true) },
            { text: 'ブラウザで表示', onPress: () => resolve(false) },
          ],
          { cancelable: false }
        );
      });

      if (useWebView) {
        setCheckoutUrl(session.url);
        setShowWebView(true);
      } else {
        // 外部ブラウザで開く
        const supported = await Linking.canOpenURL(session.url);
        if (supported) {
          await Linking.openURL(session.url);
        } else {
          Alert.alert('エラー', 'ブラウザを開けませんでした');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'エラー',
        error instanceof Error
          ? error.message
          : 'サブスクリプションの作成に失敗しました'
      );
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');

    try {
      const session = await stripeService.createPortalSession();

      // カスタマーポータルを外部ブラウザで開く
      const supported = await Linking.canOpenURL(session.url);
      if (supported) {
        await Linking.openURL(session.url);
      } else {
        Alert.alert('エラー', 'ブラウザを開けませんでした');
      }
    } catch (error) {
      console.error('Portal error:', error);
      Alert.alert(
        'エラー',
        error instanceof Error
          ? error.message
          : 'カスタマーポータルの表示に失敗しました'
      );
    } finally {
      setLoading(null);
    }
  };

  if (showWebView && checkoutUrl) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={(navState) => {
            // 成功・キャンセルURL判定
            if (navState.url.includes('/dashboard?success=true')) {
              setShowWebView(false);
              setCheckoutUrl(null);
              Alert.alert('成功', 'サブスクリプションが開始されました！');
            } else if (navState.url.includes('/pricing?canceled=true')) {
              setShowWebView(false);
              setCheckoutUrl(null);
              Alert.alert('キャンセル', 'サブスクリプションがキャンセルされました');
            }
          }}
          style={{ flex: 1 }}
        />
        <Button
          title="閉じる"
          onPress={() => {
            setShowWebView(false);
            setCheckoutUrl(null);
          }}
          containerStyle={{ margin: 10 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
        プラン選択
      </Text>

      {Object.values(PLANS).map((plan) => (
        <Card key={plan.id} containerStyle={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{plan.name}</Text>
          <Text style={{ fontSize: 16, color: '#666', marginVertical: 10 }}>
            ¥{plan.price.toLocaleString()}/月
          </Text>

          {plan.features.map((feature, index) => (
            <Text key={index} style={{ marginVertical: 2 }}>
              • {feature}
            </Text>
          ))}

          <Button
            title={
              plan.id === 'FREE'
                ? '現在のプラン'
                : loading === plan.id
                  ? '処理中...'
                  : plan.id === 'PRO'
                    ? '7日間無料でお試し'
                    : `${plan.name}を始める`
            }
            onPress={() => handleSubscribe(plan.id)}
            disabled={loading !== null}
            containerStyle={{ marginTop: 15 }}
          />
        </Card>
      ))}

      <Button
        title="サブスクリプションを管理"
        type="outline"
        onPress={handleManageSubscription}
        disabled={loading !== null}
        containerStyle={{ marginTop: 20 }}
      />
    </View>
  );
}
```

### React Native デバッグ画面コンポーネント

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Button, Card } from 'react-native-elements';
import StripeService from '../services/StripeService';

export default function StripeDebugScreen() {
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const stripeService = new StripeService();

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const [envInfo, custInfo] = await Promise.all([
        stripeService.checkEnvironment(),
        stripeService.debugCustomer(),
      ]);

      setEnvironmentInfo(envInfo);
      setCustomerInfo(custInfo);
    } catch (error) {
      console.error('Debug info load error:', error);
      Alert.alert('エラー', 'デバッグ情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return '#28a745';
      case 'WARNING': return '#ffc107';
      case 'ERROR': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>デバッグ情報を読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Stripe デバッグ情報
      </Text>

      <Button
        title="情報を更新"
        onPress={loadDebugInfo}
        containerStyle={{ marginBottom: 20 }}
      />

      {/* 環境情報 */}
      {environmentInfo && (
        <Card containerStyle={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Stripe環境設定
          </Text>

          <Text style={{
            color: getStatusColor(environmentInfo.status),
            fontWeight: 'bold',
            marginBottom: 10
          }}>
            ステータス: {environmentInfo.status}
          </Text>

          <Text style={{ fontWeight: 'bold', marginTop: 10 }}>環境:</Text>
          <Text>NODE_ENV: {environmentInfo.environment.NODE_ENV}</Text>
          <Text>本番環境: {environmentInfo.environment.isProduction ? 'はい' : 'いいえ'}</Text>
          <Text>キー設定完了: {environmentInfo.environment.hasAllStripeKeys ? 'はい' : 'いいえ'}</Text>

          <Text style={{ fontWeight: 'bold', marginTop: 10 }}>環境変数チェック:</Text>
          {Object.entries(environmentInfo.envCheck).map(([key, value]: [string, any]) => (
            <Text key={key}>
              {key}: {value.exists ? '✅' : '❌'} ({value.type})
            </Text>
          ))}

          {environmentInfo.warnings.length > 0 && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 10, color: '#ffc107' }}>警告:</Text>
              {environmentInfo.warnings.map((warning: string, index: number) => (
                <Text key={index} style={{ color: '#ffc107' }}>• {warning}</Text>
              ))}
            </>
          )}

          {environmentInfo.errors.length > 0 && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 10, color: '#dc3545' }}>エラー:</Text>
              {environmentInfo.errors.map((error: string, index: number) => (
                <Text key={index} style={{ color: '#dc3545' }}>• {error}</Text>
              ))}
            </>
          )}
        </Card>
      )}

      {/* 顧客情報 */}
      {customerInfo && (
        <Card containerStyle={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            顧客情報
          </Text>

          <Text style={{ fontWeight: 'bold', marginTop: 10 }}>データベース:</Text>
          <Text>ユーザーID: {customerInfo.user.id}</Text>
          <Text>メール: {customerInfo.user.email}</Text>
          <Text>サブスクリプション状態: {customerInfo.user.subscriptionStatus || 'なし'}</Text>
          <Text>プラン: {customerInfo.user.subscriptionPlan || 'なし'}</Text>
          <Text>StripeカスタマーID: {customerInfo.user.stripeCustomerId || 'なし'}</Text>

          {customerInfo.stripeCustomer && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Stripe:</Text>
              <Text>カスタマーID: {customerInfo.stripeCustomer.id}</Text>
              <Text>メール: {customerInfo.stripeCustomer.email}</Text>
              <Text>作成日: {new Date(customerInfo.stripeCustomer.created).toLocaleDateString('ja-JP')}</Text>
              <Text>削除済み: {customerInfo.stripeCustomer.deleted ? 'はい' : 'いいえ'}</Text>
            </>
          )}

          {customerInfo.stripeError && (
            <Text style={{ color: '#dc3545', marginTop: 10 }}>
              Stripeエラー: {customerInfo.stripeError}
            </Text>
          )}

          <Text style={{ fontWeight: 'bold', marginTop: 10 }}>環境情報:</Text>
          <Text>環境: {customerInfo.environment}</Text>
          <Text>Stripe環境: {customerInfo.stripeEnvironment}</Text>
          <Text>Stripeアクセス: {customerInfo.hasStripeAccess ? 'OK' : 'NG'}</Text>
        </Card>
      )}
    </ScrollView>
  );
}
```
