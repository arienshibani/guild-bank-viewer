"use client";

import { Edit2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
		const newGold = Math.max(0, parseInt(editGold, 10) || 0);
		const newSilver = Math.max(0, Math.min(99, parseInt(editSilver, 10) || 0));
		const newCopper = Math.max(0, Math.min(99, parseInt(editCopper, 10) || 0));

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
				<div className="flex items-center gap-2 sm:gap-3">
					{gold > 0 && (
						<span className="moneygold font-semibold text-yellow-100 text-sm sm:text-base">
							{gold}
						</span>
					)}
					{silver > 0 && (
						<span className="moneysilver font-semibold text-gray-100 text-sm sm:text-base">
							{silver}
						</span>
					)}
					{copper > 0 && (
						<span className="moneycopper font-semibold text-orange-100 text-sm sm:text-base">
							{copper}
						</span>
					)}
					{gold === 0 && silver === 0 && copper === 0 && (
						<span className="text-stone-400 text-sm sm:text-base">
							No money
						</span>
					)}
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
								<span className="moneygold text-yellow-100 font-semibold">
									Gold
								</span>
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
								<span className="moneysilver text-gray-100 font-semibold">
									Silver
								</span>
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
								<span className="moneycopper text-orange-100 font-semibold">
									Copper
								</span>
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
