import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * POST /api/generate-report
 *
 * Queues a `generate_report` job for the Railway worker to process. This route
 * does NOT generate a report itself — it only inserts a job row.
 *
 * Body: { saved_query_id: string }
 */
const generateReportSchema = z.object({
  saved_query_id: z.string().min(1, "saved_query_id is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = generateReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { saved_query_id } = parsed.data;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        job_type: "generate_report",
        status: "pending",
        payload: { saved_query_id },
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
