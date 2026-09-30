import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_GAME_MODE, type GameMode } from "@/lib/types";
import { parseWowheadTooltip, tooltipUrl } from "@/lib/wowhead";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ itemId: string }> },
) {
	const { itemId } = await params;
	const { searchParams } = new URL(request.url);
	const gameMode =
		(searchParams.get("gameMode") as GameMode | null) || DEFAULT_GAME_MODE;

	try {
		const response = await fetch(tooltipUrl(itemId, gameMode), {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; GuildBankViewer/1.0)",
			},
			next: { revalidate: 3600 }, // Cache for 1 hour
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch item data" },
				{ status: response.status },
			);
		}

		return NextResponse.json(parseWowheadTooltip(await response.json()));
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
