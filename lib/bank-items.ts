export const SLOT_COUNT = 28;

export interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

export type ImportResult =
	| { ok: true; items: BankItem[] }
	| { ok: false; error: string };

/** Put an item in a slot (replacing any occupant), or clear the slot when itemId is null. */
export function setSlot(
	items: BankItem[],
	slotNumber: number,
	itemId: number | null,
	quantity: number,
): BankItem[] {
	if (itemId === null) {
		return items.filter((item) => item.slot_number !== slotNumber);
	}
	const next = { slot_number: slotNumber, item_id: itemId, quantity };
	const index = items.findIndex((item) => item.slot_number === slotNumber);
	if (index < 0) return [...items, next];
	const copy = [...items];
	copy[index] = next;
	return copy;
}

/** Drag an item from one slot to another: moves into an empty slot, swaps with an occupied one. */
export function moveItem(
	items: BankItem[],
	from: number,
	to: number,
): BankItem[] {
	if (from === to) return items;
	const moving = items.find((item) => item.slot_number === from);
	if (!moving) return items;
	return items.map((item) => {
		if (item === moving) return { ...item, slot_number: to };
		if (item.slot_number === to) return { ...item, slot_number: from };
		return item;
	});
}

/** Merge incoming items into existing ones; incoming wins on slot conflicts. */
export function mergeItems(
	items: BankItem[],
	incoming: BankItem[],
): BankItem[] {
	return incoming.reduce(
		(acc, item) => setSlot(acc, item.slot_number, item.item_id, item.quantity),
		items,
	);
}

function isValidItem(item: unknown): item is BankItem {
	if (typeof item !== "object" || item === null) return false;
	const { slot_number, item_id, quantity } = item as Record<string, unknown>;
	return (
		typeof slot_number === "number" &&
		Number.isInteger(slot_number) &&
		slot_number >= 0 &&
		slot_number < SLOT_COUNT &&
		typeof item_id === "number" &&
		item_id > 0 &&
		typeof quantity === "number" &&
		quantity > 0
	);
}

const INVALID: ImportResult = { ok: false, error: "Invalid data string" };

/** Parse the base64-encoded JSON datastring produced by the in-game add-on / export. */
export function parseImport(data: string): ImportResult {
	if (!data.trim()) return { ok: false, error: "Please enter import data" };
	try {
		const parsed: unknown = JSON.parse(atob(data.trim()));
		if (!Array.isArray(parsed)) return INVALID;
		const items = parsed.filter(isValidItem);
		return items.length === 0 ? INVALID : { ok: true, items };
	} catch {
		return INVALID;
	}
}

export function exportItems(items: BankItem[]): string {
	return btoa(JSON.stringify(items));
}
