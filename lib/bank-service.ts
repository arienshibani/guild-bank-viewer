import type { BankItem } from "@/lib/bank-items";
import { hashPassword } from "@/lib/password";
import type { GameMode } from "@/lib/types";

/** The editable contents of a bank. */
export interface BankDraft {
	name: string;
	adminNotes: string;
	gold: number;
	silver: number;
	copper: number;
	gameMode: GameMode;
	items: BankItem[];
}

export interface Bank extends BankDraft {
	id: string;
	shareCode: string;
	passwordHash: string;
}

export type BankRow = Omit<Bank, "items">;

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** The seam: how banks are stored. Adapters: Supabase (prod), in-memory (tests). */
export interface BankStore {
	findBankByShareCode(shareCode: string): Promise<BankRow | null>;
	listItems(bankId: string): Promise<BankItem[]>;
	insertBank(row: Omit<BankRow, "id">): Promise<{ id: string }>;
	updateBank(bankId: string, patch: Partial<Omit<BankRow, "id">>): Promise<void>;
	replaceItems(bankId: string, items: BankItem[]): Promise<void>;
	isShareCodeTaken(shareCode: string): Promise<boolean>;
}

export const MIN_PASSWORD_LENGTH = 3;
export const MAX_SHARE_CODE_LENGTH = 30;

export function validateShareCode(code: string): string | null {
	if (!code.trim()) return "Share code is required";
	if (code.length > MAX_SHARE_CODE_LENGTH) {
		return `Share code must be ${MAX_SHARE_CODE_LENGTH} characters or less`;
	}
	if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
		return "Share code must be URL-friendly (letters, numbers, hyphens, and underscores only)";
	}
	return null;
}

export function validateNewPassword(
	password: string,
	confirmation: string,
): string | null {
	if (!password.trim()) return "New password is required";
	if (password !== confirmation) return "Passwords do not match";
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
	}
	return null;
}

const randomShareCode = () => Math.random().toString(36).substring(2, 10);

export function createBankService(
	store: BankStore,
	{ generateShareCode = randomShareCode } = {},
) {
	return {
		/** Load a bank and its items, or null if the share code is unknown. */
		async load(shareCode: string): Promise<Bank | null> {
			const row = await store.findBankByShareCode(shareCode);
			if (!row) return null;
			return { ...row, items: await store.listItems(row.id) };
		},

		/** Create a bank protected by `password`; returns its generated share code. */
		async create(
			draft: BankDraft,
			password: string,
		): Promise<Result<{ shareCode: string }>> {
			if (!password.trim()) {
				return { ok: false, error: "Password is required to create a bank" };
			}
			const { items, ...fields } = draft;
			const shareCode = generateShareCode();
			const { id } = await store.insertBank({
				...fields,
				shareCode,
				passwordHash: hashPassword(password),
			});
			if (items.length > 0) await store.replaceItems(id, items);
			return { ok: true, shareCode };
		},

		/** Persist the draft's fields and replace the bank's items with its items. */
		async save(bankId: string, draft: BankDraft): Promise<void> {
			const { items, ...fields } = draft;
			await store.updateBank(bankId, fields);
			await store.replaceItems(bankId, items);
		},

		async changePassword(
			bankId: string,
			newPassword: string,
			confirmation: string,
		): Promise<Result> {
			const error = validateNewPassword(newPassword, confirmation);
			if (error) return { ok: false, error };
			await store.updateBank(bankId, {
				passwordHash: hashPassword(newPassword),
			});
			return { ok: true };
		},

		/** Rename the share code; `changed` is false when the code is unchanged. */
		async changeShareCode(
			bank: { id: string; shareCode: string },
			requested: string,
		): Promise<Result<{ shareCode: string; changed: boolean }>> {
			const shareCode = requested.trim();
			const error = validateShareCode(shareCode);
			if (error) return { ok: false, error };
			if (shareCode === bank.shareCode) {
				return { ok: true, shareCode, changed: false };
			}
			if (await store.isShareCodeTaken(shareCode)) {
				return {
					ok: false,
					error: "This share code is already taken. Please choose a different one.",
				};
			}
			await store.updateBank(bank.id, { shareCode });
			return { ok: true, shareCode, changed: true };
		},
	};
}

export type BankService = ReturnType<typeof createBankService>;
