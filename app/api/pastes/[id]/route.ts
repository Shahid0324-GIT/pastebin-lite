import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Paste } from "@/lib";

function getCurrentTime(request: NextRequest): number {
  const testMode = process.env.TEST_MODE === "1";

  if (testMode) {
    const testNowMs = request.headers.get("x-test-now-ms");
    if (testNowMs) {
      return parseInt(testNowMs, 10);
    }
  }

  return Date.now();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const key = `paste:${id}`;

    const paste: Paste | null = await redis.get(key);

    if (!paste) {
      return NextResponse.json({ error: "Paste not found" }, { status: 404 });
    }

    const currentTime = getCurrentTime(request);

    if (paste.ttl_seconds !== null) {
      const expiresAt = paste.created_at + paste.ttl_seconds * 1000;
      if (currentTime >= expiresAt) {
        await redis.del(key);
        return NextResponse.json(
          { error: "Paste has expired" },
          { status: 404 }
        );
      }
    }

    if (paste.max_views !== null && paste.view_count >= paste.max_views) {
      await redis.del(key);
      return NextResponse.json(
        { error: "View limit exceeded" },
        { status: 404 }
      );
    }

    paste.view_count += 1;
    await redis.set(key, paste);

    const remainingViews =
      paste.max_views !== null ? paste.max_views - paste.view_count : null;

    const expiresAt =
      paste.ttl_seconds !== null
        ? new Date(paste.created_at + paste.ttl_seconds * 1000).toISOString()
        : null;

    return NextResponse.json(
      {
        content: paste.content,
        remaining_views: remainingViews,
        expires_at: expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
