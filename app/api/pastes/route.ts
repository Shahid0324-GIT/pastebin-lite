import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import { CreatePasteBody, Paste } from "@/lib";

function getCurrentTime(request: NextRequest): number {
  // Support deterministic time testing
  const testMode = process.env.TEST_MODE === "1";

  if (testMode) {
    const testNowMs = request.headers.get("x-test-now-ms");
    if (testNowMs) {
      return parseInt(testNowMs, 10);
    }
  }

  return Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePasteBody = await request.json();

    if (
      !body.content ||
      typeof body.content !== "string" ||
      body.content.trim() === ""
    ) {
      return NextResponse.json(
        { error: "content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (body.ttl_seconds !== undefined) {
      if (!Number.isInteger(body.ttl_seconds) || body.ttl_seconds < 1) {
        return NextResponse.json(
          { error: "ttl_seconds must be an integer >= 1" },
          { status: 400 }
        );
      }
    }

    if (body.max_views !== undefined) {
      if (!Number.isInteger(body.max_views) || body.max_views < 1) {
        return NextResponse.json(
          { error: "max_views must be an integer >= 1" },
          { status: 400 }
        );
      }
    }

    const id = nanoid(10);

    const createdAt = getCurrentTime(request);

    const paste: Paste = {
      content: body.content,
      created_at: createdAt,
      ttl_seconds: body.ttl_seconds || null,
      max_views: body.max_views || null,
      view_count: 0,
    };

    const key = `paste:${id}`;
    await redis.set(key, paste);

    if (body.ttl_seconds) {
      await redis.expire(key, body.ttl_seconds + 60);
    } else {
      await redis.expire(key, 1800);
    }

    const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const baseUrl =
      (rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : request.nextUrl.origin) ||
      "http://localhost:3000";
    const url = `${baseUrl}/p/${id}`;

    return NextResponse.json(
      {
        id,
        url,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.error("Create paste error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
