import type { BankItem } from "@/lib/bank-items";
import { ItemNotFoundError, lookupItem } from "@/lib/item-lookup";
import type { GameMode } from "@/lib/types";

type Lookup = typeof lookupItem;

/**
 * Split items into those that exist in the game mode and those that don't
 * (e.g. a wrath-only sword in a classic bank). Items we couldn't check because
 * the lookup failed for another reason (network, rate limit) are kept.
 */
export async function pruneUnavailableItems(
	items: BankItem[],
	gameMode: GameMode,
	lookup: Lookup = lookupItem,
): Promise<{ kept: BankItem[]; removed: BankItem[] }> {
	const ids = [...new Set(items.map((item) => item.item_id))];
	const missing = new Set<number>();

	await Promise.all(
		ids.map(async (id) => {
			try {
				await lookup(id, gameMode);
			} catch (error) {
				if (error instanceof ItemNotFoundError) missing.add(id);
			}
		}),
	);

	return {
		kept: items.filter((item) => !missing.has(item.item_id)),
		removed: items.filter((item) => missing.has(item.item_id)),
	};
}
