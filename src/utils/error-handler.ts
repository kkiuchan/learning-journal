import { toast } from "sonner";

/**
 * APIレスポンスのエラー型定義
 */
interface ApiErrorResponse {
  error: string;
  details?: Array<{
    path?: string[];
    message: string;
    code?: string;
  }>;
  status?: number;
}

/**
 * APIエラーレスポンスを解析して適切なエラーメッセージを生成
 */
export function parseApiError(errorData: ApiErrorResponse): string {
  // Zodバリデーションエラーの場合
  if (errorData.details && Array.isArray(errorData.details)) {
    const errorMessages = errorData.details
      .map((detail) => detail.message)
      .join("\n");
    return `入力内容に問題があります:\n${errorMessages}`;
  }

  // 通常のエラーメッセージ
  return errorData.error || "予期しないエラーが発生しました";
}

/**
 * APIリクエストのエラーハンドリング
 */
export async function handleApiError(
  response: Response,
  defaultMessage: string = "処理に失敗しました"
): Promise<never> {
  try {
    const errorData: ApiErrorResponse = await response.json();
    const errorMessage = parseApiError(errorData);
    throw new Error(errorMessage);
  } catch (parseError) {
    // JSONパースに失敗した場合は、デフォルトメッセージを使用
    if (
      parseError instanceof Error &&
      parseError.message.includes("入力内容に問題があります")
    ) {
      throw parseError;
    }
    throw new Error(defaultMessage);
  }
}

/**
 * 非同期処理のエラーハンドリング付きラッパー
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  options: {
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<T | null> {
  const {
    successMessage,
    errorMessage = "処理に失敗しました",
    showSuccessToast = false,
    showErrorToast = true,
    onSuccess,
    onError,
  } = options;

  try {
    const result = await asyncFn();

    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }

    onSuccess?.(result);
    return result;
  } catch (error) {
    const finalErrorMessage =
      error instanceof Error ? error.message : errorMessage;

    if (showErrorToast) {
      toast.error(finalErrorMessage);
    }

    console.error("Error in withErrorHandling:", error);
    onError?.(error instanceof Error ? error : new Error(finalErrorMessage));
    return null;
  }
}

/**
 * フォーム送信用のエラーハンドリング
 */
export async function handleFormSubmit<T>(
  submitFn: () => Promise<T>,
  options: {
    successMessage: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: Error) => void;
  }
): Promise<boolean> {
  const result = await withErrorHandling(submitFn, {
    ...options,
    showSuccessToast: true,
    showErrorToast: true,
  });

  return result !== null;
}

/**
 * API呼び出し用のヘルパー関数
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit & {
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const { successMessage, errorMessage, ...fetchOptions } = options;

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    await handleApiError(response, errorMessage);
  }

  const data = await response.json();

  if (successMessage) {
    toast.success(successMessage);
  }

  return data;
}
