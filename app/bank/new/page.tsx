"use client";

import { ArrowLeft, Edit, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { BankGrid } from "@/components/bank-grid";
import { ItemEditDialog } from "@/components/item-edit-dialog";
import { MoneyDisplay } from "@/components/money-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hashPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import {
	DEFAULT_GAME_MODE,
	GAME_MODE_LABELS,
	GAME_MODES,
	type GameMode,
} from "@/lib/types";

interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

export default function NewBankPage() {
	const router = useRouter();
	const bankNameId = useId();
	const passwordId = useId();
	const adminNotesId = useId();
	const gameModeId = useId();
	const [bankName, setBankName] = useState("");
	const [password, setPassword] = useState("");
	const [adminNotes, setAdminNotes] = useState("");
	const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_GAME_MODE);
	const [items, setItems] = useState<BankItem[]>([]);
	const [gold, setGold] = useState(0);
	const [silver, setSilver] = useState(0);
	const [copper, setCopper] = useState(0);
	// Bank creation is always in view mode - no edit mode toggle
	const [editingSlot, setEditingSlot] = useState<number | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const { toast } = useToast();

	const handleSlotClick = (_slotNumber: number) => {
		// During bank creation, clicking slots does nothing
		// Users must fill out the form and save to start editing
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
		// Validate password
		if (!password.trim()) {
			setPasswordError("Password is required to create a bank");
			return;
		}

		// Clear any previous errors
		setPasswordError("");
		setIsSaving(true);
		try {
			const supabase = createClient();

			// Generate a random share code
			const shareCode = Math.random().toString(36).substring(2, 10);

			// Hash the password
			const passwordHash = hashPassword(password);

			// Create the guild bank
			const { data: bankData, error: bankError } = await supabase
				.from("guild_banks")
				.insert({
					name: bankName,
					share_code: shareCode,
					password_hash: passwordHash,
					admin_notes: adminNotes,
					game_mode: gameMode,
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

			// Show success toast with vault ID
			toast({
				title: "Vault Created Successfully!",
				description: `Your vault ID is: ${shareCode}`,
			});

			// Redirect to the bank view page
			router.push(`/bank/${shareCode}`);
		} catch (error) {
			console.error("Error saving bank:", error);
			toast({
				title: "Error",
				description: "Failed to save bank. Please try again.",
				variant: "destructive",
			});
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
						placeholder="Enter a name (e.g. bank alt name or the name of your guild.)"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor={passwordId} className="text-stone-300">
						Password *
					</Label>
					<Input
						id={passwordId}
						type="password"
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							// Clear error when user starts typing
							if (passwordError) {
								setPasswordError("");
							}
						}}
						className={`bg-stone-800 text-stone-100 ${
							passwordError
								? "border-red-500 focus:border-red-400"
								: "border-stone-700 focus:border-stone-600"
						}`}
						placeholder="The password required to edit the contents of the bank"
						required
					/>
					{passwordError && (
						<p className="text-xs text-red-400">{passwordError}</p>
					)}
					<p className="text-xs text-stone-500">Make sure you remember it!</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor={gameModeId} className="text-stone-300">
						Game Mode
					</Label>
					<Select
						value={gameMode}
						onValueChange={(value: GameMode) => setGameMode(value)}
					>
						<SelectTrigger className="bg-stone-800 border-stone-700 text-stone-100">
							<SelectValue placeholder="Select game mode" />
						</SelectTrigger>
						<SelectContent className="bg-stone-800 border-stone-700">
							{GAME_MODES.map((mode) => (
								<SelectItem
									key={mode}
									value={mode}
									className="text-stone-100 hover:bg-stone-700"
								>
									{GAME_MODE_LABELS[mode]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-xs text-stone-500">
						This determines which version of item tooltips will be displayed.
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor={adminNotesId} className="text-stone-300">
						Notes (Optional)
					</Label>
					<Textarea
						id={adminNotesId}
						value={adminNotes}
						onChange={(e) => setAdminNotes(e.target.value)}
						className="bg-stone-800 border-stone-700 text-stone-100 min-h-[100px]"
						placeholder="Add notes about this bank (e.g., bank alt name, event logs, etc.)"
					/>
					<p className="text-xs text-stone-500">
						These notes are visible to everyone and can be used for tracking
						bank alt names, event logs, or other information.
					</p>
				</div>

				<div className="flex justify-center">
					<MoneyDisplay
						gold={gold}
						silver={silver}
						copper={copper}
						isEditable={true}
						onMoneyChange={handleMoneyChange}
					/>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Edit className="w-5 h-5 text-amber-500" />
						<span className="text-stone-300">
							Fill out the form above and save to start adding items to your
							bank.
						</span>
					</div>
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

				<BankGrid
					items={items}
					isEditMode={false}
					onSlotClick={handleSlotClick}
					gameMode={gameMode}
				/>
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
