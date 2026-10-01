"use client";

import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { BankGrid } from "@/components/bank-grid";
import { ImportDialog } from "@/components/import-dialog";
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
import { type BankItem, mergeItems, moveItem, setSlot } from "@/lib/bank-items";
import { createBrowserBankService } from "@/lib/bank-service.client";
import { pruneUnavailableItems } from "@/lib/prune-items";
import {
	DEFAULT_GAME_MODE,
	GAME_MODE_LABELS,
	GAME_MODES,
	type GameMode,
} from "@/lib/types";

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
	const [editingSlot, setEditingSlot] = useState<number | null>(null);
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isPruning, setIsPruning] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const pruneRun = useRef(0);
	const { toast } = useToast();

	const handleSlotClick = (slotNumber: number) => setEditingSlot(slotNumber);

	const handleSaveItem = (
		slotNumber: number,
		itemId: number | null,
		quantity: number,
	) => {
		setItems((current) => setSlot(current, slotNumber, itemId, quantity));
	};

	/** Drop items that don't exist in `mode` (e.g. a wrath sword in a classic bank). */
	const pruneForMode = async (candidates: BankItem[], mode: GameMode) => {
		const run = ++pruneRun.current;
		setIsPruning(true);
		const { removed } = await pruneUnavailableItems(candidates, mode);
		if (run !== pruneRun.current) return; // a newer change superseded this check
		setIsPruning(false);
		if (removed.length === 0) return;

		// Only remove what is still the same item, so edits made meanwhile survive.
		setItems((current) =>
			current.filter(
				(item) =>
					!removed.some(
						(r) =>
							r.slot_number === item.slot_number && r.item_id === item.item_id,
					),
			),
		);
		const ids = [...new Set(removed.map((r) => r.item_id))];
		toast({
			title: `Removed ${removed.length} item${removed.length === 1 ? "" : "s"}`,
			description: `Not available in ${GAME_MODE_LABELS[mode]} (item ID${ids.length === 1 ? "" : "s"} ${ids.join(", ")}).`,
		});
	};

	const handleGameModeChange = (mode: GameMode) => {
		setGameMode(mode);
		void pruneForMode(items, mode);
	};

	const handleImportItems = (imported: BankItem[]) => {
		setItems((current) => mergeItems(current, imported));
		void pruneForMode(imported, gameMode);
	};

	const handleMoveItem = (from: number, to: number) =>
		setItems((current) => moveItem(current, from, to));

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
		if (isPruning) return;
		setPasswordError("");
		setIsSaving(true);
		try {
			const result = await createBrowserBankService().create(
				{ name: bankName, adminNotes, gold, silver, copper, gameMode, items },
				password,
			);
			if (!result.ok) {
				setPasswordError(result.error);
				document.getElementById(passwordId)?.focus();
				return;
			}

			toast({
				title: "Vault Created Successfully!",
				description: `Your vault ID is: ${result.shareCode}`,
			});

			router.push(`/bank/${result.shareCode}`);
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

				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="text-stone-300 text-sm sm:text-base">
						Click a slot to add an item, or drag items between slots. Fill in
						the details below when you are ready to save and share.
					</p>
					<Button
						onClick={() => setShowImportDialog(true)}
						variant="outline"
						size="sm"
						className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent"
					>
						<Upload className="w-4 h-4 mr-2" />
						Import Items
					</Button>
				</div>

				<BankGrid
					items={items}
					isEditMode={true}
					onSlotClick={handleSlotClick}
					onMoveItem={handleMoveItem}
					gameMode={gameMode}
				/>

				<div className="flex justify-center">
					<MoneyDisplay
						gold={gold}
						silver={silver}
						copper={copper}
						isEditable={true}
						onMoneyChange={handleMoneyChange}
					/>
				</div>

				<section className="space-y-6 rounded-lg border border-stone-700 bg-stone-900/60 p-4 sm:p-6">
					<div>
						<h2 className="text-xl font-semibold text-amber-100">
							Save your bank
						</h2>
						<p className="text-sm text-stone-400">
							Choose a password and save to get a link you can share. Your items
							are saved with it.
						</p>
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
						<Select value={gameMode} onValueChange={handleGameModeChange}>
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
							Items that do not exist in the game mode you pick are removed from
							the bank.
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

					<div className="flex items-center justify-end gap-3">
						{isPruning && (
							<span className="flex items-center gap-2 text-sm text-stone-400">
								<Loader2 className="w-4 h-4 animate-spin" />
								Checking items for {GAME_MODE_LABELS[gameMode]}...
							</span>
						)}
						<Button
							onClick={handleSaveBank}
							disabled={isSaving || isPruning}
							size="lg"
							className="bg-amber-600 hover:bg-amber-700 text-white"
						>
							<Save className="w-4 h-4 mr-2" />
							{isSaving ? "Saving..." : "Save & Share Bank"}
						</Button>
					</div>
				</section>
			</div>

			<ItemEditDialog
				open={editingSlot !== null}
				onOpenChange={(open) => !open && setEditingSlot(null)}
				slotNumber={editingSlot ?? 0}
				currentItemId={currentItem?.item_id}
				currentQuantity={currentItem?.quantity}
				gameMode={gameMode}
				onSave={handleSaveItem}
			/>

			<ImportDialog
				open={showImportDialog}
				onOpenChange={setShowImportDialog}
				onImport={handleImportItems}
				items={items}
			/>
		</main>
	);
}
