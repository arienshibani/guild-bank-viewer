import type { BankItem } from "@/lib/bank-items";
import type { BankRow, BankStore } from "@/lib/bank-service";

/** In-memory BankStore adapter, for tests and local fakes. */
export function memoryBankStore() {
	const banks = new Map<string, BankRow>();
	const items = new Map<string, BankItem[]>();
	let nextId = 1;

	const store: BankStore = {
		async findBankByShareCode(shareCode) {
			return [...banks.values()].find((b) => b.shareCode === shareCode) ?? null;
		},
		async listItems(bankId) {
			return [...(items.get(bankId) ?? [])].sort(
				(a, b) => a.slot_number - b.slot_number,
			);
		},
		async insertBank(row) {
			const id = `bank-${nextId++}`;
			banks.set(id, { ...row, id });
			return { id };
		},
		async updateBank(bankId, patch) {
			const existing = banks.get(bankId);
			if (!existing) throw new Error(`No bank ${bankId}`);
			banks.set(bankId, { ...existing, ...patch });
		},
		async replaceItems(bankId, next) {
			items.set(bankId, [...next]);
		},
		async isShareCodeTaken(shareCode) {
			return [...banks.values()].some((b) => b.shareCode === shareCode);
		},
	};
	return { store, banks, items };
}
