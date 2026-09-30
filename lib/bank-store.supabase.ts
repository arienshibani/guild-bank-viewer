import type { SupabaseClient } from "@supabase/supabase-js";
import type { BankItem } from "@/lib/bank-items";
import type { BankRow, BankStore } from "@/lib/bank-service";
import type { GameMode } from "@/lib/types";

interface GuildBankRow {
	id: string;
	name: string;
	share_code: string;
	password_hash: string;
	admin_notes: string | null;
	game_mode: GameMode | null;
	gold: number | null;
	silver: number | null;
	copper: number | null;
}

const COLUMN: Record<keyof Omit<BankRow, "id">, string> = {
	name: "name",
	shareCode: "share_code",
	passwordHash: "password_hash",
	adminNotes: "admin_notes",
	gameMode: "game_mode",
	gold: "gold",
	silver: "silver",
	copper: "copper",
};

function toRow(row: GuildBankRow, defaultGameMode: GameMode): BankRow {
	return {
		id: row.id,
		name: row.name,
		shareCode: row.share_code,
		passwordHash: row.password_hash,
		adminNotes: row.admin_notes || "",
		gameMode: row.game_mode || defaultGameMode,
		gold: row.gold || 0,
		silver: row.silver || 0,
		copper: row.copper || 0,
	};
}

function toColumns(patch: Partial<Omit<BankRow, "id">>) {
	return Object.fromEntries(
		Object.entries(patch).map(([key, value]) => [
			COLUMN[key as keyof typeof COLUMN],
			value,
		]),
	);
}

export function supabaseBankStore(
	supabase: SupabaseClient,
	defaultGameMode: GameMode,
): BankStore {
	return {
		async findBankByShareCode(shareCode) {
			const { data } = await supabase
				.from("guild_banks")
				.select("*")
				.eq("share_code", shareCode)
				.single();
			return data ? toRow(data as GuildBankRow, defaultGameMode) : null;
		},

		async listItems(bankId) {
			const { data } = await supabase
				.from("bank_items")
				.select("*")
				.eq("guild_bank_id", bankId)
				.order("slot_number");
			return (data as BankItem[] | null) || [];
		},

		async insertBank(row) {
			const { data, error } = await supabase
				.from("guild_banks")
				.insert(toColumns(row))
				.select()
				.single();
			if (error) throw error;
			return { id: data.id };
		},

		async updateBank(bankId, patch) {
			const { error } = await supabase
				.from("guild_banks")
				.update({ ...toColumns(patch), updated_at: new Date().toISOString() })
				.eq("id", bankId);
			if (error) throw error;
		},

		async replaceItems(bankId, items) {
			const { error: deleteError } = await supabase
				.from("bank_items")
				.delete()
				.eq("guild_bank_id", bankId);
			if (deleteError) throw deleteError;

			if (items.length === 0) return;
			const { error } = await supabase.from("bank_items").insert(
				items.map((item) => ({
					guild_bank_id: bankId,
					slot_number: item.slot_number,
					item_id: item.item_id,
					quantity: item.quantity,
				})),
			);
			if (error) throw error;
		},

		async isShareCodeTaken(shareCode) {
			const { data } = await supabase
				.from("guild_banks")
				.select("id")
				.eq("share_code", shareCode)
				.maybeSingle();
			return data !== null;
		},
	};
}
