import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { supabaseBankStore } from "./bank-store.supabase";

type Call = [string, ...unknown[]];

/** Chainable stand-in for the Supabase query builder that records calls and resolves to `result`. */
function fakeSupabase(result: { data?: unknown; error?: unknown } = {}) {
	const calls: Call[] = [];
	const builder: Record<string, unknown> = {};
	const res = { data: null, error: null, ...result };
	for (const method of [
		"select", "insert", "update", "delete", "eq", "order", "single", "maybeSingle",
	]) {
		builder[method] = (...args: unknown[]) => {
			calls.push([method, ...args]);
			return builder;
		};
	}
	builder.then = (resolve: (value: unknown) => void) => resolve(res);
	const client = {
		from: (table: string) => {
			calls.push(["from", table]);
			return builder;
		},
	} as unknown as SupabaseClient;
	return { client, calls };
}

describe("supabaseBankStore", () => {
	it("maps a guild_banks row to a BankRow, defaulting nullable columns", async () => {
		const { client } = fakeSupabase({
			data: {
				id: "1", name: "V", share_code: "abc", password_hash: "s:h",
				admin_notes: null, game_mode: null, gold: null, silver: 2, copper: null,
			},
		});
		expect(await supabaseBankStore(client, "classic").findBankByShareCode("abc")).toEqual({
			id: "1", name: "V", shareCode: "abc", passwordHash: "s:h",
			adminNotes: "", gameMode: "classic", gold: 0, silver: 2, copper: 0,
		});
	});

	it("returns null when no bank matches", async () => {
		const { client } = fakeSupabase({ data: null, error: { code: "PGRST116" } });
		expect(await supabaseBankStore(client, "classic").findBankByShareCode("x")).toBeNull();
	});

	it("writes snake_case columns on update and stamps updated_at", async () => {
		const { client, calls } = fakeSupabase();
		await supabaseBankStore(client, "classic").updateBank("1", {
			shareCode: "new", adminNotes: "n", gameMode: "wotlk", passwordHash: "s:h",
		});
		const update = calls.find(([m]) => m === "update")?.[1] as Record<string, unknown>;
		expect(update).toMatchObject({
			share_code: "new", admin_notes: "n", game_mode: "wotlk", password_hash: "s:h",
		});
		expect(typeof update.updated_at).toBe("string");
		expect(calls).toContainEqual(["eq", "id", "1"]);
	});

	it("replaces items by deleting then inserting snake_case rows", async () => {
		const { client, calls } = fakeSupabase();
		await supabaseBankStore(client, "classic").replaceItems("b1", [
			{ slot_number: 3, item_id: 9, quantity: 2 },
		]);
		expect(calls.map(([m]) => m)).toEqual(["from", "delete", "eq", "from", "insert"]);
		expect(calls[4][1]).toEqual([
			{ guild_bank_id: "b1", slot_number: 3, item_id: 9, quantity: 2 },
		]);
	});

	it("only deletes when the new item list is empty", async () => {
		const { client, calls } = fakeSupabase();
		await supabaseBankStore(client, "classic").replaceItems("b1", []);
		expect(calls.map(([m]) => m)).toEqual(["from", "delete", "eq"]);
	});

	it("surfaces errors, including a failed delete", async () => {
		const { client } = fakeSupabase({ error: new Error("boom") });
		const store = supabaseBankStore(client, "classic");
		await expect(store.replaceItems("b1", [])).rejects.toThrow("boom");
		await expect(store.updateBank("b1", { name: "x" })).rejects.toThrow("boom");
	});

	it("detects a taken share code", async () => {
		const taken = fakeSupabase({ data: { id: "1" } });
		expect(await supabaseBankStore(taken.client, "classic").isShareCodeTaken("a")).toBe(true);
		const free = fakeSupabase({ data: null });
		expect(await supabaseBankStore(free.client, "classic").isShareCodeTaken("a")).toBe(false);
	});
});
