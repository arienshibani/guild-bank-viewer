import { describe, expect, it } from "vitest";
import { verifyPassword } from "./password";
import {
	type BankDraft,
	createBankService,
	validateNewPassword,
	validateShareCode,
} from "./bank-service";
import { memoryBankStore } from "./bank-store.memory";

const draft = (overrides: Partial<BankDraft> = {}): BankDraft => ({
	name: "Vault",
	adminNotes: "",
	gold: 1,
	silver: 2,
	copper: 3,
	gameMode: "classic",
	items: [{ slot_number: 0, item_id: 5, quantity: 2 }],
	...overrides,
});

function setup() {
	const memory = memoryBankStore();
	const service = createBankService(memory.store, {
		generateShareCode: () => "abc123",
	});
	return { ...memory, service };
}

describe("create / load", () => {
	it("creates a bank that loads back with its items and a verifiable password", async () => {
		const { service } = setup();
		const created = await service.create(draft(), "secret");
		expect(created).toEqual({ ok: true, shareCode: "abc123" });

		const bank = await service.load("abc123");
		expect(bank).toMatchObject({ name: "Vault", gold: 1, gameMode: "classic" });
		expect(bank?.items).toEqual(draft().items);
		expect(verifyPassword("secret", bank?.passwordHash ?? "")).toBe(true);
		expect(verifyPassword("wrong", bank?.passwordHash ?? "")).toBe(false);
	});
	it("requires a password", async () => {
		const { service, banks } = setup();
		expect(await service.create(draft(), "  ")).toEqual({
			ok: false,
			error: "Password is required to create a bank",
		});
		expect(banks.size).toBe(0);
	});
	it("returns null for an unknown share code", async () => {
		expect(await setup().service.load("nope")).toBeNull();
	});
});

describe("save", () => {
	it("updates fields and replaces items, including removing all of them", async () => {
		const { service } = setup();
		await service.create(draft(), "secret");
		const bank = await service.load("abc123");
		await service.save(bank!.id, draft({ name: "Renamed", gold: 9, items: [] }));
		expect(await service.load("abc123")).toMatchObject({
			name: "Renamed",
			gold: 9,
			items: [],
		});
	});
});

describe("changePassword", () => {
	it("rejects invalid passwords without touching the bank", async () => {
		const { service } = setup();
		await service.create(draft(), "secret");
		const before = await service.load("abc123");
		for (const [pw, confirm] of [["", ""], ["abc", "abd"], ["ab", "ab"]]) {
			const result = await service.changePassword(before!.id, pw, confirm);
			expect(result.ok).toBe(false);
		}
		expect((await service.load("abc123"))?.passwordHash).toBe(before?.passwordHash);
	});
	it("stores a new verifiable hash", async () => {
		const { service } = setup();
		await service.create(draft(), "secret");
		const bank = await service.load("abc123");
		expect(await service.changePassword(bank!.id, "newpw", "newpw")).toEqual({ ok: true });
		const after = await service.load("abc123");
		expect(verifyPassword("newpw", after!.passwordHash)).toBe(true);
		expect(verifyPassword("secret", after!.passwordHash)).toBe(false);
	});
});

describe("changeShareCode", () => {
	it("renames the share code", async () => {
		const { service } = setup();
		await service.create(draft(), "secret");
		const bank = (await service.load("abc123"))!;
		expect(await service.changeShareCode(bank, " new-code ")).toEqual({
			ok: true,
			shareCode: "new-code",
			changed: true,
		});
		expect(await service.load("abc123")).toBeNull();
		expect(await service.load("new-code")).not.toBeNull();
	});
	it("treats an unchanged code as a no-op", async () => {
		const { service } = setup();
		await service.create(draft(), "secret");
		const bank = (await service.load("abc123"))!;
		expect(await service.changeShareCode(bank, "abc123")).toEqual({
			ok: true,
			shareCode: "abc123",
			changed: false,
		});
	});
	it("rejects a code that is taken or invalid", async () => {
		const { service, store } = setup();
		await service.create(draft(), "secret");
		await store.insertBank({ ...(await store.findBankByShareCode("abc123"))!, shareCode: "taken" });
		const bank = (await service.load("abc123"))!;
		expect(await service.changeShareCode(bank, "taken")).toMatchObject({ ok: false });
		expect(await service.changeShareCode(bank, "bad code!")).toMatchObject({ ok: false });
		expect((await service.load("abc123"))?.id).toBe(bank.id);
	});
});

describe("validators", () => {
	it("validateShareCode", () => {
		expect(validateShareCode("ok_code-1")).toBeNull();
		expect(validateShareCode("")).toMatch(/required/);
		expect(validateShareCode("x".repeat(31))).toMatch(/30/);
		expect(validateShareCode("a b")).toMatch(/URL-friendly/);
	});
	it("validateNewPassword", () => {
		expect(validateNewPassword("abc", "abc")).toBeNull();
		expect(validateNewPassword(" ", " ")).toMatch(/required/);
		expect(validateNewPassword("abc", "abd")).toMatch(/match/);
		expect(validateNewPassword("ab", "ab")).toMatch(/at least 3/);
	});
});
