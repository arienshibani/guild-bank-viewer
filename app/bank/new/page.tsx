"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { BankGrid } from "@/components/bank-grid";
import { ItemEditDialog } from "@/components/item-edit-dialog";
import { MoneyDisplay } from "@/components/money-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Edit, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

export default function NewBankPage() {
	const router = useRouter();
	const bankNameId = useId();
	const [bankName, setBankName] = useState("My Guild Bank");
	const [items, setItems] = useState<BankItem[]>([]);
	const [gold, setGold] = useState(0);
	const [silver, setSilver] = useState(0);
	const [copper, setCopper] = useState(0);
	const [isEditMode, setIsEditMode] = useState(true);
	const [editingSlot, setEditingSlot] = useState<number | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const handleSlotClick = (slotNumber: number) => {
		if (isEditMode) {
			setEditingSlot(slotNumber);
		}
	};

	const handleSaveItem = (
		slotNumber: number,
		itemId: number | null,
		quantity: number,
	) => {
		if (itemId === null) {
			// Remove item
			setItems(items.filter((item) => item.slot_number !== slotNumber));
		} else {
			// Add or update item
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

	const handleSaveBank = async () => {
		setIsSaving(true);
		try {
			const supabase = createClient();

			// Generate a random share code
			const shareCode = Math.random().toString(36).substring(2, 10);

			// Create the guild bank
			const { data: bankData, error: bankError } = await supabase
				.from("guild_banks")
				.insert({
					name: bankName,
					share_code: shareCode,
					gold,
					silver,
					copper,
				})
				.select()
				.single();

			if (bankError) throw bankError;

			// Insert all items
			if (items.length > 0) {
				const itemsToInsert = items.map((item) => ({
					guild_bank_id: bankData.id,
					slot_number: item.slot_number,
					item_id: item.item_id,
					quantity: item.quantity,
				}));

				const { error: itemsError } = await supabase
					.from("bank_items")
					.insert(itemsToInsert);

				if (itemsError) throw itemsError;
			}

			// Redirect to the bank view page
			router.push(`/bank/${shareCode}`);
		} catch (error) {
			console.error("Error saving bank:", error);
			alert("Failed to save bank. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const currentItem = items.find((item) => item.slot_number === editingSlot);

	return (
		<main className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-950 p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<Link href="/">
						<Button
							variant="ghost"
							className="text-stone-400 hover:text-stone-100"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back
						</Button>
					</Link>
					<h1 className="text-3xl font-bold text-amber-100">
						Create Guild Bank
					</h1>
					<div className="w-24" />
				</div>

				<div className="space-y-2">
					<Label htmlFor={bankNameId} className="text-stone-300">
						Bank Name
					</Label>
					<Input
						id={bankNameId}
						value={bankName}
						onChange={(e) => setBankName(e.target.value)}
						className="bg-stone-800 border-stone-700 text-stone-100"
						placeholder="Enter bank name"
					/>
				</div>

				<div className="bg-stone-800 border border-stone-700 rounded-lg p-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-amber-100">
							Guild Bank Money
						</h3>
						<MoneyDisplay
							gold={gold}
							silver={silver}
							copper={copper}
							isEditable={true}
							onMoneyChange={handleMoneyChange}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Edit className="w-5 h-5 text-amber-500" />
						<span className="text-stone-300">
							{isEditMode ? "Edit Mode: Click slots to add items" : "View Mode"}
						</span>
					</div>
					<Button
						onClick={() => setIsEditMode(!isEditMode)}
						variant="outline"
						className="border-stone-700 text-stone-300 hover:bg-stone-800"
					>
						{isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
					</Button>
				</div>

				<BankGrid
					items={items}
					isEditMode={isEditMode}
					onSlotClick={handleSlotClick}
				/>

				<div className="flex justify-end">
					<Button
						onClick={handleSaveBank}
						disabled={isSaving}
						size="lg"
						className="bg-amber-600 hover:bg-amber-700 text-white"
					>
						<Save className="w-4 h-4 mr-2" />
						{isSaving ? "Saving..." : "Save & Share Bank"}
					</Button>
				</div>
			</div>

			<ItemEditDialog
				open={editingSlot !== null}
				onOpenChange={(open) => !open && setEditingSlot(null)}
				slotNumber={editingSlot ?? 0}
				currentItemId={currentItem?.item_id}
				currentQuantity={currentItem?.quantity}
				onSave={handleSaveItem}
			/>
		</main>
	);
}
