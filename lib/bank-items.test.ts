import { describe, expect, it } from "vitest";
import {
	type BankItem,
	exportItems,
	mergeItems,
	parseImport,
	SLOT_COUNT,
	setSlot,
} from "./bank-items";

const item = (slot_number: number, item_id = 100, quantity = 1): BankItem => ({
	slot_number,
	item_id,
	quantity,
});
const encode = (value: unknown) => btoa(JSON.stringify(value));

describe("setSlot", () => {
	it("adds an item to an empty slot", () => {
		expect(setSlot([item(0)], 1, 5, 2)).toEqual([item(0), item(1, 5, 2)]);
	});
	it("replaces the occupant of a slot", () => {
		expect(setSlot([item(0, 1)], 0, 9, 3)).toEqual([item(0, 9, 3)]);
	});
	it("clears a slot when itemId is null", () => {
		expect(setSlot([item(0), item(1)], 0, null, 0)).toEqual([item(1)]);
	});
	it("does not mutate its input", () => {
		const input = [item(0)];
		setSlot(input, 0, 7, 1);
		expect(input).toEqual([item(0)]);
	});
});

describe("mergeItems", () => {
	it("lets incoming items win on conflict and keeps the rest", () => {
		const merged = mergeItems([item(0, 1), item(1, 2)], [item(1, 99), item(2, 3)]);
		expect(merged).toEqual([item(0, 1), item(1, 99), item(2, 3)]);
	});
});

describe("parseImport", () => {
	it("round-trips through exportItems", () => {
		const items = [item(0, 5, 2), item(27, 6, 1)];
		expect(parseImport(exportItems(items))).toEqual({ ok: true, items });
	});
	it("rejects empty input", () => {
		expect(parseImport("  ")).toEqual({
			ok: false,
			error: "Please enter import data",
		});
	});
	it("rejects non-base64, non-JSON and non-array data", () => {
		for (const bad of ["%%%", btoa("nope"), encode({ a: 1 })]) {
			expect(parseImport(bad)).toEqual({ ok: false, error: "Invalid data string" });
		}
	});
	it("drops invalid entries but keeps valid ones", () => {
		const result = parseImport(
			encode([
				item(0),
				item(SLOT_COUNT), // out of range: DB check constraint is < 28
				item(-1),
				item(1, 0),
				item(2, 5, 0),
				{ slot_number: "3", item_id: 1, quantity: 1 },
				null,
			]),
		);
		expect(result).toEqual({ ok: true, items: [item(0)] });
	});
	it("fails when nothing valid remains", () => {
		expect(parseImport(encode([item(SLOT_COUNT)])).ok).toBe(false);
	});
});
