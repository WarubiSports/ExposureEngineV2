import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = createServerClient();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (id) {
      // Fetch single evaluation
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
        }
        throw error;
      }

      return NextResponse.json({ success: true, evaluation: data });
    }

    // Fetch list of evaluations
    const { data, error } = await supabase
      .from("evaluations")
      .select("id, first_name, last_name, position, grad_year, overall_score, bucket, rating, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch evaluations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      evaluations: data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Fetch evaluations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}
