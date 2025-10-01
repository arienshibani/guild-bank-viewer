"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Edit2 } from "lucide-react";

interface MoneyDisplayProps {
	gold: number;
	silver: number;
	copper: number;
	isEditable?: boolean;
	onMoneyChange?: (gold: number, silver: number, copper: number) => void;
}

export function MoneyDisplay({
	gold,
	silver,
	copper,
	isEditable = false,
	onMoneyChange,
}: MoneyDisplayProps) {
	const [isEditing, setIsEditing] = useState(false);
	const goldId = useId();
	const silverId = useId();
	const copperId = useId();
	const [editGold, setEditGold] = useState(gold.toString());
	const [editSilver, setEditSilver] = useState(silver.toString());
	const [editCopper, setEditCopper] = useState(copper.toString());

	const handleSave = () => {
		const newGold = Math.max(0, parseInt(editGold) || 0);
		const newSilver = Math.max(0, Math.min(99, parseInt(editSilver) || 0));
		const newCopper = Math.max(0, Math.min(99, parseInt(editCopper) || 0));

		onMoneyChange?.(newGold, newSilver, newCopper);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setEditGold(gold.toString());
		setEditSilver(silver.toString());
		setEditCopper(copper.toString());
		setIsEditing(false);
	};

	return (
		<>
			<div className="flex items-center gap-2 sm:gap-4">
				<div className="flex items-center gap-2 sm:gap-3 text-yellow-400">
					<span className="flex items-center gap-1 sm:gap-2">
						<span className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full border-2 border-yellow-300 shadow-lg shadow-yellow-500/30 relative">
							<span className="absolute inset-0.5 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full opacity-60"></span>
							<span className="absolute inset-1 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full opacity-40"></span>
						</span>
						<span className="font-semibold text-yellow-100 text-sm sm:text-base">
							{gold}
						</span>
					</span>
					<span className="flex items-center gap-1 sm:gap-2">
						<span className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-full border-2 border-gray-200 shadow-lg shadow-gray-400/30 relative">
							<span className="absolute inset-0.5 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full opacity-60"></span>
							<span className="absolute inset-1 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full opacity-40"></span>
						</span>
						<span className="font-semibold text-gray-100 text-sm sm:text-base">
							{silver}
						</span>
					</span>
					<span className="flex items-center gap-1 sm:gap-2">
						<span className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-full border-2 border-orange-400 shadow-lg shadow-orange-600/30 relative">
							<span className="absolute inset-0.5 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full opacity-60"></span>
							<span className="absolute inset-1 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full opacity-40"></span>
						</span>
						<span className="font-semibold text-orange-100 text-sm sm:text-base">
							{copper}
						</span>
					</span>
				</div>

				{isEditable && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsEditing(true)}
						className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-stone-400 hover:text-stone-200"
					>
						<Edit2 className="w-3 h-3" />
					</Button>
				)}
			</div>

			<Dialog open={isEditing} onOpenChange={setIsEditing}>
				<DialogContent className="bg-stone-900 border-stone-700 text-stone-100 max-w-sm sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-amber-100 text-sm sm:text-base">
							Edit Guild Bank Money
						</DialogTitle>
						<DialogDescription className="text-stone-400 text-xs sm:text-sm">
							Enter the amount of gold, silver, and copper in the guild bank.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
						<div className="grid gap-2">
							<Label
								htmlFor={goldId}
								className="text-stone-300 flex items-center gap-2 text-sm"
							>
								<span className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full border border-yellow-300"></span>
								Gold
							</Label>
							<Input
								id={goldId}
								type="number"
								min="0"
								placeholder="0"
								value={editGold}
								onChange={(e) => setEditGold(e.target.value)}
								className="bg-stone-800 border-stone-700 text-stone-100 text-sm sm:text-base"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor={silverId}
								className="text-stone-300 flex items-center gap-2 text-sm"
							>
								<span className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full border border-gray-300"></span>
								Silver
							</Label>
							<Input
								id={silverId}
								type="number"
								min="0"
								max="99"
								placeholder="0"
								value={editSilver}
								onChange={(e) => setEditSilver(e.target.value)}
								className="bg-stone-800 border-stone-700 text-stone-100 text-sm sm:text-base"
							/>
						</div>
						<div className="grid gap-2">
							<Label
								htmlFor={copperId}
								className="text-stone-300 flex items-center gap-2 text-sm"
							>
								<span className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-600 rounded-full border border-orange-400"></span>
								Copper
							</Label>
							<Input
								id={copperId}
								type="number"
								min="0"
								max="99"
								placeholder="0"
								value={editCopper}
								onChange={(e) => setEditCopper(e.target.value)}
								className="bg-stone-800 border-stone-700 text-stone-100 text-sm sm:text-base"
							/>
						</div>
					</div>
					<DialogFooter className="gap-2 flex-col sm:flex-row">
						<Button
							variant="outline"
							onClick={handleCancel}
							className="border-stone-600 text-stone-300 hover:bg-stone-800 text-sm sm:text-base w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							className="bg-amber-600 hover:bg-amber-700 text-white text-sm sm:text-base w-full sm:w-auto"
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
