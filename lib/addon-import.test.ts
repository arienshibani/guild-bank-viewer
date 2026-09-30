import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exportItems, parseImport } from "./bank-items";

// Golden strings shared with the WoW addon (guild-bank-viewer-addon,
// fixtures/import-strings.json). Keep both copies identical.
const cases: { name: string; items: unknown[]; string: string }[] = JSON.parse(
	readFileSync("fixtures/addon-import-strings.json", "utf8"),
);

describe("addon import strings", () => {
	for (const { name, items, string } of cases) {
		it(`${name}: matches exportItems`, () => {
			expect(exportItems(items as never)).toBe(string);
		});

		it(`${name}: parseImport accepts it`, () => {
			if (items.length === 0) {
				// An empty bank has nothing to import.
				expect(parseImport(string).ok).toBe(false);
			} else {
				expect(parseImport(string)).toEqual({ ok: true, items });
			}
		});
	}
});
