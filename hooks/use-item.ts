"use client";

import { useEffect, useState } from "react";
import { lookupItem } from "@/lib/item-lookup";
import type { GameMode } from "@/lib/types";
import type { ItemData } from "@/lib/wowhead";

interface UseItemOptions {
	/** Defer the lookup until true (e.g. until a tooltip is shown). */
	enabled?: boolean;
}

export function useItem(
	itemId: number | undefined,
	gameMode?: GameMode,
	{ enabled = true }: UseItemOptions = {},
) {
	const [loaded, setLoaded] = useState<{ id: number; data: ItemData } | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!itemId) {
			setLoaded(null);
			return;
		}
		if (!enabled) return;

		let cancelled = false;
		setIsLoading(true);
		setError(null);
		lookupItem(itemId, gameMode)
			.then((data) => !cancelled && setLoaded({ id: itemId, data }))
			.catch(() => !cancelled && setError("Failed to load item data"))
			.finally(() => !cancelled && setIsLoading(false));

		return () => {
			cancelled = true;
		};
	}, [itemId, gameMode, enabled]);

	// Never expose data that belongs to a previous itemId.
	const item = loaded && loaded.id === itemId ? loaded.data : null;
	return { item, isLoading, error };
}
