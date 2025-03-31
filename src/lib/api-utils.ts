import { NextResponse } from "next/server";
import { ApiResponse, ApiError } from "@/types/api";

export const createApiResponse = <T>(data: T): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({ data });
};

export const createErrorResponse = (
  error: string,
  status: number = 400
): NextResponse<ApiError> => {
  return NextResponse.json({ error }, { status });
};

export function createSuccessResponse(
  message: string,
  status: number = 200
): NextResponse<{ message: string }> {
  return NextResponse.json({ message }, { status });
}
