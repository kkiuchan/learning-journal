import { createSupabaseServerClient } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("[Debug] Creating Supabase client...");
    const supabase = await createSupabaseServerClient();

    console.log("[Debug] Getting session...");
    const { data: session, error: sessionError } =
      await supabase.auth.getSession();

    console.log("[Debug] Getting user...");
    const { data: user, error: userError } = await supabase.auth.getUser();

    const debugInfo = {
      timestamp: new Date().toISOString(),
      sessionExists: !!session?.session,
      userExists: !!user?.user,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null,
      sessionDetails: session?.session
        ? {
            userId: session.session.user.id,
            userEmail: session.session.user.email,
            accessToken: session.session.access_token ? "present" : "missing",
            refreshToken: session.session.refresh_token ? "present" : "missing",
          }
        : null,
      userDetails: user?.user
        ? {
            id: user.user.id,
            email: user.user.email,
            emailConfirmed: user.user.email_confirmed_at ? true : false,
          }
        : null,
    };

    console.log("[Debug] Session info:", debugInfo);

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    console.error("[Debug] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
