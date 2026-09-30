"use client";

import { useEffect, useState } from "react";
import { MIN_QUERY_LENGTH, searchItems } from "@/lib/item-search";
import type { GameMode } from "@/lib/types";
import type { ItemSearchResult } from "@/lib/wowhead";

const DEBOUNCE_MS = 300;

/** Debounced item search; results are always for the latest query and game mode. */
export function useItemSearch(query: string, gameMode: GameMode) {
	const [results, setResults] = useState<ItemSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < MIN_QUERY_LENGTH) {
			setResults([]);
			setIsSearching(false);
			setError(null);
			return;
		}

		const controller = new AbortController();
		setIsSearching(true);
		const timer = setTimeout(() => {
			searchItems(trimmed, gameMode, controller.signal)
				.then((found) => {
					setResults(found);
					setError(null);
				})
				.catch((err) => {
					if (controller.signal.aborted) return;
					console.error("Item search failed:", err);
					setResults([]);
					setError("Search failed. Try again.");
				})
				.finally(() => {
					if (!controller.signal.aborted) setIsSearching(false);
				});
		}, DEBOUNCE_MS);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [query, gameMode]);

	return { results, isSearching, error };
}
