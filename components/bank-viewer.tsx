"use client";

import { useState } from "react";
import { BankGrid } from "./bank-grid";
import { ItemEditDialog } from "./item-edit-dialog";
import { MoneyDisplay } from "./money-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Edit, Save, Share2, Check, Lock, Unlock } from "lucide-react";

interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

interface BankViewerProps {
	bankId: string;
	shareCode: string;
	initialItems: BankItem[];
	bankName: string;
	initialGold?: number;
	initialSilver?: number;
	initialCopper?: number;
}

export function BankViewer({
	bankId,
	shareCode,
	initialItems,
	initialGold = 0,
	initialSilver = 0,
	initialCopper = 0,
}: BankViewerProps) {
	const [items, setItems] = useState<BankItem[]>(initialItems);
	const [gold, setGold] = useState(initialGold);
	const [silver, setSilver] = useState(initialSilver);
	const [copper, setCopper] = useState(initialCopper);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editingSlot, setEditingSlot] = useState<number | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [copied, setCopied] = useState(false);
	const [password, setPassword] = useState("");
	const [isUnlocked, setIsUnlocked] = useState(false);
	const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/bank/${shareCode}`
			: "";

	const handleSlotClick = (slotNumber: number) => {
		if (isEditMode && isUnlocked) {
			setEditingSlot(slotNumber);
		}
	};

	const handleSaveItem = (
		slotNumber: number,
		itemId: number | null,
		quantity: number,
	) => {
		if (itemId === null) {
			setItems(items.filter((item) => item.slot_number !== slotNumber));
		} else {
			const existingIndex = items.findIndex(
				(item) => item.slot_number === slotNumber,
			);
			if (existingIndex >= 0) {
				const newItems = [...items];
				newItems[existingIndex] = {
					slot_number: slotNumber,
					item_id: itemId,
					quantity,
				};
				setItems(newItems);
			} else {
				setItems([
					...items,
					{ slot_number: slotNumber, item_id: itemId, quantity },
				]);
			}
		}
	};

	const handleMoneyChange = (
		newGold: number,
		newSilver: number,
		newCopper: number,
	) => {
		setGold(newGold);
		setSilver(newSilver);
		setCopper(newCopper);
	};

	const handleSaveChanges = async () => {
		if (!isUnlocked) return;

		setIsSaving(true);
		try {
			const supabase = createClient();

			// Update guild bank money
			const { error: moneyError } = await supabase
				.from("guild_banks")
				.update({
					gold,
					silver,
					copper,
					updated_at: new Date().toISOString(),
				})
				.eq("id", bankId);

			if (moneyError) throw moneyError;

			// Delete all existing items for this bank
			await supabase.from("bank_items").delete().eq("guild_bank_id", bankId);

			// Insert updated items
			if (items.length > 0) {
				const itemsToInsert = items.map((item) => ({
					guild_bank_id: bankId,
					slot_number: item.slot_number,
					item_id: item.item_id,
					quantity: item.quantity,
				}));

				const { error } = await supabase
					.from("bank_items")
					.insert(itemsToInsert);

				if (error) throw error;
			}

			alert("Bank updated successfully!");
			setIsEditMode(false);
		} catch (error) {
			console.error("Error saving changes:", error);
			alert("Failed to save changes. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleCopyLink = () => {
		navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleUnlock = () => {
		// Simple password check - in production, this should be more secure
		if (password === "admin") {
			setIsUnlocked(true);
			setShowPasswordPrompt(false);
		} else {
			alert("Incorrect password");
		}
	};

	const handleEditModeToggle = () => {
		if (!isEditMode && !isUnlocked) {
			setShowPasswordPrompt(true);
		} else {
			setIsEditMode(!isEditMode);
		}
	};

	const currentItem = items.find((item) => item.slot_number === editingSlot);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div className="flex items-center gap-2">
					{isUnlocked ? (
						<Unlock className="w-5 h-5 text-green-500" />
					) : (
						<Lock className="w-5 h-5 text-stone-500" />
					)}
					<span className="text-stone-300">
						{isEditMode
							? "Edit Mode: Click slots to modify items"
							: "View Mode"}
					</span>
				</div>

				<div className="flex gap-2">
					<Button
						onClick={handleCopyLink}
						variant="outline"
						className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent"
					>
						{copied ? (
							<Check className="w-4 h-4 mr-2" />
						) : (
							<Share2 className="w-4 h-4 mr-2" />
						)}
						{copied ? "Copied!" : "Copy Share Link"}
					</Button>

					<Button
						onClick={handleEditModeToggle}
						variant="outline"
						className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent"
					>
						<Edit className="w-4 h-4 mr-2" />
						{isEditMode ? "Exit Edit Mode" : "Edit Bank"}
					</Button>
				</div>
			</div>

			{showPasswordPrompt && !isUnlocked && (
				<div className="bg-stone-800 border border-stone-700 rounded-lg p-4 space-y-3">
					<p className="text-stone-300">Enter password to edit this bank:</p>
					<div className="flex gap-2">
						<Input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
							placeholder="Enter password"
							className="bg-stone-900 border-stone-700 text-stone-100"
						/>
						<Button
							onClick={handleUnlock}
							className="bg-amber-600 hover:bg-amber-700 text-white"
						>
							Unlock
						</Button>
						<Button
							onClick={() => setShowPasswordPrompt(false)}
							variant="outline"
							className="border-stone-700 text-stone-300"
						>
							Cancel
						</Button>
					</div>
					<p className="text-xs text-stone-500">Default password: admin</p>
				</div>
			)}

			<div className="space-y-4">
				<div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-amber-100">
							Guild Bank Money
						</h3>
						<MoneyDisplay
							gold={gold}
							silver={silver}
							copper={copper}
							isEditable={isEditMode && isUnlocked}
							onMoneyChange={handleMoneyChange}
						/>
					</div>
				</div>

				<BankGrid
					items={items}
					isEditMode={isEditMode && isUnlocked}
					onSlotClick={handleSlotClick}
				/>
			</div>

			{isEditMode && isUnlocked && (
				<div className="flex justify-end">
					<Button
						onClick={handleSaveChanges}
						disabled={isSaving}
						size="lg"
						className="bg-amber-600 hover:bg-amber-700 text-white"
					>
						<Save className="w-4 h-4 mr-2" />
						{isSaving ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			)}

			<ItemEditDialog
				open={editingSlot !== null}
				onOpenChange={(open) => !open && setEditingSlot(null)}
				slotNumber={editingSlot ?? 0}
				currentItemId={currentItem?.item_id}
				currentQuantity={currentItem?.quantity}
				onSave={handleSaveItem}
			/>
		</div>
	);
}
