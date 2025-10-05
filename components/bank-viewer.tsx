"use client";

import { Check, Edit, Key, Lock, Save, Share2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import { BankGrid } from "./bank-grid";
import { ImportDialog } from "./import-dialog";
import { ItemEditDialog } from "./item-edit-dialog";
import { MoneyDisplay } from "./money-display";

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
	passwordHash: string;
	initialAdminNotes?: string;
	initialGold?: number;
	initialSilver?: number;
	initialCopper?: number;
}

export function BankViewer({
	bankId,
	shareCode,
	initialItems,
	bankName,
	passwordHash,
	initialAdminNotes = "",
	initialGold = 0,
	initialSilver = 0,
	initialCopper = 0,
}: BankViewerProps) {
	const [items, setItems] = useState<BankItem[]>(initialItems);
	const [name, setName] = useState(bankName);
	const [gold, setGold] = useState(initialGold);
	const [silver, setSilver] = useState(initialSilver);
	const [copper, setCopper] = useState(initialCopper);
	const [adminNotes, setAdminNotes] = useState(initialAdminNotes);
	const [isEditMode, setIsEditMode] = useState(false);
	const [editingSlot, setEditingSlot] = useState<number | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [copied, setCopied] = useState(false);
	const [password, setPassword] = useState("");
	const [isUnlocked, setIsUnlocked] = useState(false);
	const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [unlockError, setUnlockError] = useState("");
	const [showImportDialog, setShowImportDialog] = useState(false);
	const { toast } = useToast();

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

			// Update guild bank money and admin notes
			const { error: moneyError } = await supabase
				.from("guild_banks")
				.update({
					name,
					gold,
					silver,
					copper,
					admin_notes: adminNotes,
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

			toast({
				title: "Success",
				description: "Bank updated successfully!",
			});
			setIsEditMode(false);
		} catch (error) {
			console.error("Error saving changes:", error);
			toast({
				title: "Error",
				description: "Failed to save changes. Please try again.",
				variant: "destructive",
			});
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
		// Clear any previous errors
		setUnlockError("");

		// Verify password against stored hash
		if (verifyPassword(password, passwordHash)) {
			setIsUnlocked(true);
			setShowPasswordPrompt(false);
			setPassword(""); // Clear password on success
		} else {
			setUnlockError("Incorrect password");
			setPassword(""); // Clear password on failure
			toast({
				title: "",
				description: "Incorrect password",
				variant: "destructive",
			});
		}
	};

	const handleEditModeToggle = () => {
		if (!isEditMode && !isUnlocked) {
			setShowPasswordPrompt(true);
			setUnlockError(""); // Clear any previous errors when opening prompt
		} else {
			setIsEditMode(!isEditMode);
		}
	};

	const handleChangePassword = async () => {
		// Validate passwords
		if (!newPassword.trim()) {
			setPasswordError("New password is required");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPasswordError("Passwords do not match");
			return;
		}
		if (newPassword.length < 3) {
			setPasswordError("Password must be at least 3 characters");
			return;
		}

		setPasswordError("");
		setIsChangingPassword(true);

		try {
			const supabase = createClient();
			const newPasswordHash = hashPassword(newPassword);

			const { error } = await supabase
				.from("guild_banks")
				.update({ password_hash: newPasswordHash })
				.eq("id", bankId);

			if (error) throw error;

			toast({
				title: "Success",
				description: "Password changed successfully!",
			});
			setShowPasswordChange(false);
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			console.error("Error changing password:", error);
			toast({
				title: "Error",
				description: "Failed to change password. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsChangingPassword(false);
		}
	};

	const handleImportItems = (importedItems: BankItem[]) => {
		// Merge imported items with existing items, replacing any conflicts
		const newItems = [...items];

		importedItems.forEach((importedItem) => {
			const existingIndex = newItems.findIndex(
				(item) => item.slot_number === importedItem.slot_number,
			);

			if (existingIndex >= 0) {
				// Replace existing item
				newItems[existingIndex] = importedItem;
			} else {
				// Add new item
				newItems.push(importedItem);
			}
		});

		setItems(newItems);
	};

	const currentItem = items.find((item) => item.slot_number === editingSlot);

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="flex items-center justify-between flex-wrap gap-2 sm:gap-4">
				<div className="flex items-center gap-2">
					{isUnlocked ? (
						<></>
					) : (
						<Lock className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />
					)}
					<span className="text-stone-300 text-sm sm:text-base">
						{isEditMode ? "Edit Mode: Click slots to modify items" : ""}
					</span>
				</div>

				<div className="flex gap-1 sm:gap-2">
					<Button
						onClick={handleCopyLink}
						variant="outline"
						size="sm"
						className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent text-xs sm:text-sm"
					>
						{copied ? (
							<Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
						) : (
							<Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
						)}
						<span className="hidden sm:inline">
							{copied ? "Copied!" : "Copy Share Link"}
						</span>
						<span className="sm:hidden">{copied ? "✓" : "Share"}</span>
					</Button>

					{isEditMode && isUnlocked && (
						<Button
							onClick={() => setShowImportDialog(true)}
							variant="outline"
							size="sm"
							className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent text-xs sm:text-sm"
						>
							<Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
							<span className="hidden sm:inline">Import Items</span>
							<span className="sm:hidden">Import</span>
						</Button>
					)}

					<Button
						onClick={handleEditModeToggle}
						variant="outline"
						size="sm"
						className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent text-xs sm:text-sm"
					>
						<Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
						<span className="hidden sm:inline">
							{isEditMode ? "Exit Edit Mode" : "Edit Bank"}
						</span>
						<span className="sm:hidden">{isEditMode ? "Exit" : "Edit"}</span>
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
							onChange={(e) => {
								setPassword(e.target.value);
								if (unlockError) setUnlockError(""); // Clear error when typing
							}}
							onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
							placeholder="Enter password"
							className={`bg-stone-900 text-stone-100 ${
								unlockError
									? "border-red-500 focus:border-red-400"
									: "border-stone-700 focus:border-stone-600"
							}`}
						/>
						<Button
							onClick={handleUnlock}
							className="bg-amber-600 hover:bg-amber-700 text-white"
						>
							Unlock
						</Button>
						<Button
							onClick={() => {
								setShowPasswordPrompt(false);
								setUnlockError("");
								setPassword("");
							}}
							variant="outline"
							className="border-stone-700 text-stone-300"
						>
							Cancel
						</Button>
					</div>
					{unlockError && <p className="text-xs text-red-400">{unlockError}</p>}
					<p className="text-xs text-stone-500">
						Enter the password set when creating this bank
					</p>
				</div>
			)}

			<div className="space-y-3 sm:space-y-4">
				<BankGrid
					items={items}
					isEditMode={isEditMode && isUnlocked}
					onSlotClick={handleSlotClick}
				/>

				<div className="flex justify-center">
					<MoneyDisplay
						gold={gold}
						silver={silver}
						copper={copper}
						isEditable={isEditMode && isUnlocked}
						onMoneyChange={handleMoneyChange}
					/>
				</div>

				{adminNotes && (
					<div className="space-y-2">
						<div className="text-stone-300 text-sm font-medium">Notes</div>
						<div className="bg-stone-800 border border-stone-700 rounded-lg p-2 sm:p-3 text-stone-100 whitespace-pre-wrap text-sm sm:text-base">
							{adminNotes}
						</div>
					</div>
				)}

				{isEditMode && isUnlocked && (
					<div className="space-y-4">
						<div className="space-y-2">
							<div className="text-stone-300 text-sm font-medium">
								Edit Title
							</div>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="bg-stone-800 border-stone-700 text-stone-100 text-sm sm:text-base"
								placeholder="Enter bank title"
							/>
							<p className="text-xs text-stone-500">
								This title is shown at the top of the vault.
							</p>
						</div>
						<div className="space-y-2">
							<div className="text-stone-300 text-sm font-medium">
								Edit Notes
							</div>
							<Textarea
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								className="bg-stone-800 border-stone-700 text-stone-100 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
								placeholder="Add notes about this bank (e.g., bank alt name, event logs, etc.)"
							/>
							<p className="text-xs text-stone-500">
								These notes are visible to everyone and can be used for tracking
								bank alt names, event logs, or other information.
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="text-stone-300 text-sm font-medium">
									Change Password
								</div>
								<Button
									onClick={() => setShowPasswordChange(!showPasswordChange)}
									variant="outline"
									size="sm"
									className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent"
								>
									<Key className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
									{showPasswordChange ? "Cancel" : "Change"}
								</Button>
							</div>

							{showPasswordChange && (
								<div className="bg-stone-800 border border-stone-700 rounded-lg p-3 space-y-3">
									<div className="space-y-2">
										<Input
											type="password"
											value={newPassword}
											onChange={(e) => {
												setNewPassword(e.target.value);
												if (passwordError) setPasswordError("");
											}}
											placeholder="New password"
											className="bg-stone-900 border-stone-700 text-stone-100"
										/>
										<Input
											type="password"
											value={confirmPassword}
											onChange={(e) => {
												setConfirmPassword(e.target.value);
												if (passwordError) setPasswordError("");
											}}
											placeholder="Confirm new password"
											className="bg-stone-900 border-stone-700 text-stone-100"
										/>
									</div>
									{passwordError && (
										<p className="text-xs text-red-400">{passwordError}</p>
									)}
									<div className="flex gap-2">
										<Button
											onClick={handleChangePassword}
											disabled={isChangingPassword}
											size="sm"
											className="bg-amber-600 hover:bg-amber-700 text-white"
										>
											{isChangingPassword ? "Changing..." : "Change Password"}
										</Button>
										<Button
											onClick={() => {
												setShowPasswordChange(false);
												setNewPassword("");
												setConfirmPassword("");
												setPasswordError("");
											}}
											variant="outline"
											size="sm"
											className="border-stone-700 text-stone-300"
										>
											Cancel
										</Button>
									</div>
									<p className="text-xs text-stone-500">
										This will change the password required to edit this bank
									</p>
								</div>
							)}
						</div>
					</div>
				)}
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

			<ImportDialog
				open={showImportDialog}
				onOpenChange={setShowImportDialog}
				onImport={handleImportItems}
				items={items}
			/>
		</div>
	);
}
