"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
	type BankItem,
	mergeItems,
	moveItem,
	setSlot,
} from "@/lib/bank-items";
import { createBrowserBankService } from "@/lib/bank-service.client";
import {
	canEdit,
	cancelUnlock,
	clearUnlockError,
	type EditAccess,
	exitEditMode,
	initialAccess,
	toggleEditMode,
	unlock,
} from "@/lib/edit-access";
import type { GameMode } from "@/lib/types";

interface InitialBank {
	bankId: string;
	shareCode: string;
	passwordHash: string;
	items: BankItem[];
	name: string;
	adminNotes: string;
	gold: number;
	silver: number;
	copper: number;
	gameMode: GameMode;
}

/** A viewer's session with one bank: the editable draft, edit access, and the actions that persist it. */
export function useBankSession(initial: InitialBank) {
	const { bankId, passwordHash } = initial;
	const [items, setItems] = useState(initial.items);
	const [name, setName] = useState(initial.name);
	const [adminNotes, setAdminNotes] = useState(initial.adminNotes);
	const [gold, setGold] = useState(initial.gold);
	const [silver, setSilver] = useState(initial.silver);
	const [copper, setCopper] = useState(initial.copper);
	const [gameMode, setGameMode] = useState(initial.gameMode);
	const [shareCode, setShareCode] = useState(initial.shareCode);
	const [access, setAccess] = useState<EditAccess>(initialAccess);
	const [isSaving, setIsSaving] = useState(false);
	const { toast } = useToast();

	const failed = (description: string) =>
		toast({ title: "Error", description, variant: "destructive" });

	return {
		// draft
		items,
		name,
		adminNotes,
		gold,
		silver,
		copper,
		gameMode,
		shareCode,
		setName,
		setAdminNotes,
		setGameMode,
		setMoney: (g: number, s: number, c: number) => {
			setGold(g);
			setSilver(s);
			setCopper(c);
		},
		setItem: (slot: number, itemId: number | null, quantity: number) =>
			setItems((current) => setSlot(current, slot, itemId, quantity)),
		moveItem: (from: number, to: number) =>
			setItems((current) => moveItem(current, from, to)),
		importItems: (incoming: BankItem[]) =>
			setItems((current) => mergeItems(current, incoming)),

		// access
		access,
		canEdit: canEdit(access),
		toggleEditMode: () => setAccess(toggleEditMode),
		cancelUnlock: () => setAccess(cancelUnlock),
		clearUnlockError: () => setAccess(clearUnlockError),
		unlock: (password: string) => {
			const next = unlock(access, password, passwordHash);
			setAccess(next);
			if (!next.isUnlocked) {
				toast({
					title: "",
					description: next.unlockError,
					variant: "destructive",
				});
			}
		},

		// persistence
		isSaving,
		save: async () => {
			if (!access.isUnlocked) return;
			setIsSaving(true);
			try {
				await createBrowserBankService().save(bankId, {
					name,
					adminNotes,
					gold,
					silver,
					copper,
					gameMode,
					items,
				});
				toast({ title: "Success", description: "Bank updated successfully!" });
				setAccess(exitEditMode);
			} catch (error) {
				console.error("Error saving changes:", error);
				failed("Failed to save changes. Please try again.");
			} finally {
				setIsSaving(false);
			}
		},

		/** Returns an error message to show next to the form, or null on success. */
		changePassword: async (
			newPassword: string,
			confirmation: string,
		): Promise<string | null> => {
			try {
				const result = await createBrowserBankService().changePassword(
					bankId,
					newPassword,
					confirmation,
				);
				if (!result.ok) return result.error;
				toast({
					title: "Success",
					description: "Password changed successfully!",
				});
			} catch (error) {
				console.error("Error changing password:", error);
				failed("Failed to change password. Please try again.");
			}
			return null;
		},

		/** Returns an error message to show next to the form, or null on success. */
		changeShareCode: async (requested: string): Promise<string | null> => {
			try {
				const result = await createBrowserBankService().changeShareCode(
					{ id: bankId, shareCode },
					requested,
				);
				if (!result.ok) return result.error;
				if (result.changed) {
					setShareCode(result.shareCode);
					window.history.replaceState(null, "", `/bank/${result.shareCode}`);
					toast({
						title: "Success",
						description: "Share code updated successfully!",
					});
				}
			} catch (error) {
				console.error("Error changing share code:", error);
				failed("Failed to change share code. Please try again.");
			}
			return null;
		},
	};
}
