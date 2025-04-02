import { ApiResponse } from "@/types";
import { NextResponse } from "next/server";

export const createApiResponse = <T>(data: T): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({ data });
};

export const createErrorResponse = (
  error: string,
  status: number = 400
): NextResponse<{ error: string }> => {
  return NextResponse.json({ error }, { status });
};

export function createSuccessResponse(
  message: string,
  status: number = 200
): NextResponse<{ message: string }> {
  return NextResponse.json({ message }, { status });
}
