import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const [banks, items] = await Promise.all([
			supabase.from("guild_banks").select("*", { count: "exact", head: true }),
			supabase.from("bank_items").select("*", { count: "exact", head: true }),
		]);

		if (banks.error || items.error) throw banks.error ?? items.error;

		return NextResponse.json(
			{ banks: banks.count ?? 0, items: items.count ?? 0 },
			{ headers: { "Cache-Control": "public, s-maxage=300" } },
		);
	} catch {
		return NextResponse.json(
			{ error: "Failed to load stats" },
			{ status: 500 },
		);
	}
}
