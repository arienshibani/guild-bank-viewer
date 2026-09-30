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
import { Textarea } from "@/components/ui/textarea";
import { useBankSession } from "@/hooks/use-bank-session";
import type { BankItem } from "@/lib/bank-items";
import {
	DEFAULT_GAME_MODE,
	GAME_MODE_LABELS,
	GAME_MODES,
	type GameMode,
} from "@/lib/types";
import { BankGrid } from "./bank-grid";
import { ImportDialog } from "./import-dialog";
import { ItemEditDialog } from "./item-edit-dialog";
import { MoneyDisplay } from "./money-display";

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
}: BankViewerProps) {
	const session = useBankSession({
		bankId,
		shareCode,
		passwordHash,
		items: initialItems,
		name: bankName,
		adminNotes: initialAdminNotes,
		gold: initialGold,
		silver: initialSilver,
		copper: initialCopper,
		gameMode: initialGameMode,
	});
	const { items, name, adminNotes, gold, silver, copper, gameMode, isSaving } =
		session;
	const { setName, setAdminNotes, setGameMode } = session;
	const { isUnlocked, isEditMode, showPasswordPrompt, unlockError } =
		session.access;

	const [editingSlot, setEditingSlot] = useState<number | null>(null);
	const [copied, setCopied] = useState(false);
	const [password, setPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPasswordChange, setShowPasswordChange] = useState(false);
	const [passwordError, setPasswordError] = useState("");
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [showImportDialog, setShowImportDialog] = useState(false);
	const [newShareCode, setNewShareCode] = useState(shareCode);
	const [shareCodeError, setShareCodeError] = useState("");
	const [isChangingShareCode, setIsChangingShareCode] = useState(false);

	const shareUrl =
		typeof window !== "undefined"
			? `${window.location.origin}/bank/${session.shareCode}`
			: "";

	const handleSlotClick = (slotNumber: number) => {
		if (session.canEdit) setEditingSlot(slotNumber);
	};

	const handleCopyLink = () => {
		navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleUnlock = () => {
		session.unlock(password);
		setPassword("");
	};

	const handleChangePassword = async () => {
		setPasswordError("");
		setIsChangingPassword(true);
		const error = await session.changePassword(newPassword, confirmPassword);
		setIsChangingPassword(false);
		if (error) {
			setPasswordError(error);
			return;
		}
		setShowPasswordChange(false);
		setNewPassword("");
		setConfirmPassword("");
	};

	const handleShareCodeChange = async () => {
		setShareCodeError("");
		setIsChangingShareCode(true);
		const error = await session.changeShareCode(newShareCode);
		setIsChangingShareCode(false);
		if (error) {
			setShareCodeError(error);
			return;
		}
		setNewShareCode((code) => code.trim());
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

					{session.canEdit && (
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
						onClick={session.toggleEditMode}
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
								if (unlockError) session.clearUnlockError();
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
								session.cancelUnlock();
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
					isEditMode={session.canEdit}
					onSlotClick={handleSlotClick}
					onMoveItem={session.moveItem}
					gameMode={gameMode}
				/>

				<div className="flex justify-center">
					<MoneyDisplay
						gold={gold}
						silver={silver}
						copper={copper}
						isEditable={session.canEdit}
						onMoneyChange={session.setMoney}
					/>
				</div>

				{adminNotes && (
					<div className="space-y-2">
						<div className="text-stone-300 text-sm font-medium">Notes</div>
						<div className="bg-transparent  p-2 sm:p-3 text-stone-100 whitespace-pre-wrap text-sm sm:text-base">
							{adminNotes}
						</div>
					</div>
				)}

				{session.canEdit && (
					<div className="space-y-4">
						{/* Horizontal layout for larger screens */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
							{/* Game Mode Field */}
							<div className="space-y-2">
								<div className="text-stone-300 text-sm font-medium">
									Game Mode
								</div>
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
									onChange={(e) => setName(e.target.value)}
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
								<div className="flex gap-2">
									<Input
										value={newShareCode}
										onChange={(e) => {
											setNewShareCode(e.target.value);
											if (shareCodeError) setShareCodeError("");
										}}
										onKeyDown={(e) =>
											e.key === "Enter" && handleShareCodeChange()
										}
										className={`bg-stone-800 text-stone-100 text-sm sm:text-base ${
											shareCodeError
												? "border-red-500 focus:border-red-400"
												: "border-stone-700 focus:border-stone-600"
										}`}
										placeholder="Enter share code"
										maxLength={30}
									/>
									<Button
										onClick={handleShareCodeChange}
										className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 whitespace-nowrap"
									>
										{isChangingShareCode ? "Saving..." : "Update"}
									</Button>
								</div>
								{shareCodeError && (
									<p className="text-xs text-red-400">{shareCodeError}</p>
								)}
								<p className="text-xs text-stone-500">Must be URL-friendly.</p>
							</div>
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
					</div>
				)}
			</div>

			{session.canEdit && (
				<div className="flex justify-end">
					<Button
						onClick={session.save}
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
				gameMode={gameMode}
				onSave={session.setItem}
			/>

			<ImportDialog
				open={showImportDialog}
				onOpenChange={setShowImportDialog}
				onImport={session.importItems}
				items={items}
			/>
		</div>
	);
}
