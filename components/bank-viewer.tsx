"use client";

import { Check, Edit, Key, Lock, Save, Share2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";
import {
	type BankSlotConfig,
	DEFAULT_BANK_SLOT_CONFIG,
	DEFAULT_GAME_MODE,
	GAME_MODE_LABELS,
	GAME_MODES,
	type GameMode,
} from "@/lib/types";
import { BagSlotConfiguration } from "./bag-slot-configuration";
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
	initialGameMode?: GameMode;
	initialSlotConfigs?: BankSlotConfig[];
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
	initialGameMode = DEFAULT_GAME_MODE,
	initialSlotConfigs = DEFAULT_BANK_SLOT_CONFIG,
}: BankViewerProps) {
	const [items, setItems] = useState<BankItem[]>(initialItems);
	const [name, setName] = useState(bankName);
	const [gold, setGold] = useState(initialGold);
	const [silver, setSilver] = useState(initialSilver);
	const [copper, setCopper] = useState(initialCopper);
	const [adminNotes, setAdminNotes] = useState(initialAdminNotes);
	const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
	const [slotConfigs, setSlotConfigs] =
		useState<BankSlotConfig[]>(initialSlotConfigs);
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
	const [newShareCode, setNewShareCode] = useState(shareCode);
	const [shareCodeError, setShareCodeError] = useState("");
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [currentTab, setCurrentTab] = useState("bank-settings");
	const { toast } = useToast();

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/bank/${newShareCode}`
			: "";

	// Check if there are unsaved changes
	const checkForUnsavedChanges = () => {
		const hasChanges =
			name !== bankName ||
			newShareCode.trim() !== shareCode ||
			adminNotes !== initialAdminNotes ||
			gameMode !== initialGameMode ||
			gold !== initialGold ||
			silver !== initialSilver ||
			copper !== initialCopper ||
			JSON.stringify(items) !== JSON.stringify(initialItems) ||
			JSON.stringify(slotConfigs) !== JSON.stringify(initialSlotConfigs);

		setHasUnsavedChanges(hasChanges);
		return hasChanges;
	};

	// Reset all changes to original values
	const resetChanges = () => {
		setName(bankName);
		setNewShareCode(shareCode);
		setAdminNotes(initialAdminNotes);
		setGameMode(initialGameMode);
		setGold(initialGold);
		setSilver(initialSilver);
		setCopper(initialCopper);
		setItems(initialItems);
		setSlotConfigs(initialSlotConfigs);
		setHasUnsavedChanges(false);
		setShareCodeError("");
	};

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
		let newItems: BankItem[];
		if (itemId === null) {
			newItems = items.filter((item) => item.slot_number !== slotNumber);
		} else {
			const existingIndex = items.findIndex(
				(item) => item.slot_number === slotNumber,
			);
			if (existingIndex >= 0) {
				newItems = [...items];
				newItems[existingIndex] = {
					slot_number: slotNumber,
					item_id: itemId,
					quantity,
				};
			} else {
				newItems = [
					...items,
					{ slot_number: slotNumber, item_id: itemId, quantity },
				];
			}
		}
		setItems(newItems);
		// Check for unsaved changes after a short delay to ensure state is updated
		setTimeout(checkForUnsavedChanges, 0);
	};

	const handleMoneyChange = (
		newGold: number,
		newSilver: number,
		newCopper: number,
	) => {
		setGold(newGold);
		setSilver(newSilver);
		setCopper(newCopper);
		// Check for unsaved changes after a short delay to ensure state is updated
		setTimeout(checkForUnsavedChanges, 0);
	};

	const handleSaveChanges = async () => {
		if (!isUnlocked) return;

		setIsSaving(true);
		try {
			const supabase = createClient();

			// Validate share code if it has changed
			const trimmedShareCode = newShareCode.trim();
			if (trimmedShareCode !== shareCode) {
				const validationError = validateShareCode(trimmedShareCode);
				if (validationError) {
					setShareCodeError(validationError);
					setIsSaving(false);
					return;
				}

				// Check if the new share code is already taken
				const { data: existingBank } = await supabase
					.from("guild_banks")
					.select("id")
					.eq("share_code", trimmedShareCode)
					.single();

				if (existingBank) {
					setShareCodeError(
						"This share code is already taken. Please choose a different one.",
					);
					setIsSaving(false);
					return;
				}
			}

			// Update guild bank with all changes including share code
			const updateData: {
				name: string;
				gold: number;
				silver: number;
				copper: number;
				admin_notes: string;
				game_mode: GameMode;
				bag_configs: BankSlotConfig[];
				updated_at: string;
				share_code?: string;
			} = {
				name,
				gold,
				silver,
				copper,
				admin_notes: adminNotes,
				game_mode: gameMode,
				bag_configs: slotConfigs,
				updated_at: new Date().toISOString(),
			};

			// Only update share code if it has changed
			if (trimmedShareCode !== shareCode) {
				updateData.share_code = trimmedShareCode;
			}

			const { error: moneyError } = await supabase
				.from("guild_banks")
				.update(updateData)
				.eq("id", bankId);

			if (moneyError) throw moneyError;

			// Update URL if share code changed
			if (trimmedShareCode !== shareCode && typeof window !== "undefined") {
				window.history.replaceState(null, "", `/bank/${trimmedShareCode}`);
			}

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

			// Clear share code error if it was set
			if (shareCodeError) {
				setShareCodeError("");
			}

			// Reset unsaved changes flag
			setHasUnsavedChanges(false);

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
			setIsEditMode(true);
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
		// Check for unsaved changes after a short delay to ensure state is updated
		setTimeout(checkForUnsavedChanges, 0);
	};

	const handleSlotConfigChange = (slotIndex: number, bagTypeId: string) => {
		const newSlotConfigs = [...slotConfigs];
		newSlotConfigs[slotIndex] = {
			slotIndex,
			bagTypeId,
		};
		setSlotConfigs(newSlotConfigs);
		// Check for unsaved changes after a short delay to ensure state is updated
		setTimeout(checkForUnsavedChanges, 0);
	};

	const validateShareCode = (code: string): string | null => {
		if (!code.trim()) {
			return "Share code is required";
		}
		if (code.length > 30) {
			return "Share code must be 30 characters or less";
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
			return "Share code must be URL-friendly (letters, numbers, hyphens, and underscores only)";
		}
		return null;
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
					gameMode={gameMode}
					slotConfigs={slotConfigs}
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

				{adminNotes && !isEditMode && (
					<div className="space-y-2">
						<div className="text-stone-300 text-sm font-medium">Notes</div>
						<div className="bg-transparent  p-2 sm:p-3 text-stone-100 whitespace-pre-wrap text-sm sm:text-base">
							{adminNotes}
						</div>
					</div>
				)}

				{isEditMode && isUnlocked && (
					<Tabs
						value={currentTab}
						onValueChange={(value) => {
							if (hasUnsavedChanges) {
								toast({
									title: "Unsaved Changes",
									description:
										"You have unsaved changes. Save your changes or use the 'Reset Changes' button to discard them before switching tabs.",
									variant: "destructive",
								});
								return;
							}
							setCurrentTab(value);
						}}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-2 bg-stone-800 border-stone-700">
							<TabsTrigger
								value="bank-settings"
								className="data-[state=active]:bg-stone-700 data-[state=active]:text-stone-100 text-stone-300"
								disabled={hasUnsavedChanges && currentTab !== "bank-settings"}
							>
								Bank Settings
							</TabsTrigger>
							<TabsTrigger
								value="bank-slots"
								className="data-[state=active]:bg-stone-700 data-[state=active]:text-stone-100 text-stone-300"
								disabled={hasUnsavedChanges && currentTab !== "bank-slots"}
							>
								Configure Bank Slots
							</TabsTrigger>
						</TabsList>

						<TabsContent value="bank-settings" className="space-y-4 mt-4">
							{/* Horizontal layout for larger screens */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
								{/* Game Mode Field */}
								<div className="space-y-2">
									<div className="text-stone-300 text-sm font-medium">
										Game Mode
									</div>
									<Select
										value={gameMode}
										onValueChange={(value: GameMode) => {
											setGameMode(value);
											setTimeout(checkForUnsavedChanges, 0);
										}}
									>
										<SelectTrigger className="bg-stone-800 border-stone-700 text-stone-100 w-full">
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
										Determines fetched tooltip information
									</p>
								</div>
								{/* Title Field */}
								<div className="space-y-2">
									<div className="text-stone-300 text-sm font-medium">
										Edit Vault Title
									</div>
									<Input
										value={name}
										onChange={(e) => {
											setName(e.target.value);
											setTimeout(checkForUnsavedChanges, 0);
										}}
										className="bg-stone-800 border-stone-700 text-stone-100 text-sm sm:text-base"
										placeholder="Enter bank title"
									/>
									<p className="text-xs text-stone-500">
										This title is shown at the top of the vault.
									</p>
								</div>

								{/* Share Code Field */}
								<div className="space-y-2">
									<div className="text-stone-300 text-sm font-medium">
										Change Share Code
									</div>
									<Input
										value={newShareCode}
										onChange={(e) => {
											setNewShareCode(e.target.value);
											if (shareCodeError) setShareCodeError("");
											setTimeout(checkForUnsavedChanges, 0);
										}}
										className={`bg-stone-800 text-stone-100 text-sm sm:text-base ${
											shareCodeError
												? "border-red-500 focus:border-red-400"
												: "border-stone-700 focus:border-stone-600"
										}`}
										placeholder="Enter share code"
										maxLength={30}
									/>
									{shareCodeError && (
										<p className="text-xs text-red-400">{shareCodeError}</p>
									)}
									<p className="text-xs text-stone-500">
										Must be URL-friendly. Changes will be saved with other bank
										settings.
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<div className="text-stone-300 text-sm font-medium">
									Edit Notes
								</div>
								<Textarea
									value={adminNotes}
									onChange={(e) => {
										setAdminNotes(e.target.value);
										setTimeout(checkForUnsavedChanges, 0);
									}}
									className="bg-stone-800 border-stone-700 text-stone-100 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
									placeholder="Add notes about this bank (e.g., bank alt name, event logs, etc.)"
								/>
								<p className="text-xs text-stone-500">
									These notes are visible to everyone and can be used for
									tracking bank alt names, event logs, or other information.
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Button
										onClick={() => setShowPasswordChange(!showPasswordChange)}
										variant="outline"
										size="sm"
										className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent"
									>
										<Key className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
										{showPasswordChange ? "Cancel" : "New Password"}
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
						</TabsContent>

						<TabsContent value="bank-slots" className="space-y-4 mt-4">
							<BagSlotConfiguration
								slotConfigs={slotConfigs}
								onSlotConfigChange={handleSlotConfigChange}
							/>
						</TabsContent>
					</Tabs>
				)}
			</div>

			{isEditMode && isUnlocked && (
				<div className="flex justify-end gap-2">
					{hasUnsavedChanges && (
						<Button
							onClick={resetChanges}
							variant="outline"
							size="lg"
							className="border-stone-700 text-stone-300 hover:bg-stone-800"
						>
							Reset Changes
						</Button>
					)}
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
