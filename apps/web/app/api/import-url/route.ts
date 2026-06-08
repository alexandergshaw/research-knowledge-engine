import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const importUrlSchema = z.object({
  url: z.string().url(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  tags: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = importUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, category, subcategory, tags } = parsed.data;
    const tagArray = tags
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        job_type: "import_url",
        status: "pending",
        payload: {
          url,
          category: category || null,
          subcategory: subcategory || null,
          tags: tagArray,
        },
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
