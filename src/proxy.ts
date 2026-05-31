import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "anonymous"
  );
}

export async function proxy(request: NextRequest) {
  // Only apply rate limiting to /api/ routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Extract client IP
    const ip = getClientIp(request);

    // Set lower limit for prediction endpoints, higher for general lookup endpoints
    const isPredict = request.nextUrl.pathname.includes("/api/predict") || request.nextUrl.pathname.includes("/api/cutoffs");
    const limit = isPredict ? 30 : 60;

    const { success, remaining, reset } = await rateLimit(ip, limit);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later.", rateLimited: true, resetAt: reset },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
