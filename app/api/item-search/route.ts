import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_GAME_MODE, type GameMode } from "@/lib/types";
import { parseSearchResults, searchUrl } from "@/lib/wowhead";

const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const query = (searchParams.get("q") ?? "").trim();
	const gameMode =
		(searchParams.get("gameMode") as GameMode | null) || DEFAULT_GAME_MODE;

	if (query.length < MIN_QUERY_LENGTH) return NextResponse.json([]);

	try {
		const response = await fetch(searchUrl(query, gameMode), {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; GuildBankViewer/1.0)",
			},
			next: { revalidate: 3600 },
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to search items" },
				{ status: response.status },
			);
		}

		return NextResponse.json(parseSearchResults(await response.json()));
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
