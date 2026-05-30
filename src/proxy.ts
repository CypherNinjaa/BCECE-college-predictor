import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limiter";

export async function proxy(request: NextRequest) {
  // Only apply rate limiting to /api/ routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Extract client IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ??
      request.headers.get("x-real-ip") ??
      "anonymous";

    // Set lower limit for prediction endpoints, higher for general lookup endpoints
    const isPredict = request.nextUrl.pathname.includes("/api/predict") || request.nextUrl.pathname.includes("/api/cutoffs");
    const limit = isPredict ? 30 : 60;

    const { success, remaining, reset } = await rateLimit(ip, limit);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
