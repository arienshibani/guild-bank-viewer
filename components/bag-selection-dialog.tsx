"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BAG_TYPES, type BagType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BagSelectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onBagSelect: (bagTypeId: string) => void;
	currentBagTypeId?: string;
}

const qualityBorders = [
	"border-gray-600", // Poor (0)
	"border-stone-600", // Common (1)
	"border-green-600", // Uncommon (2)
	"border-blue-600", // Rare (3)
	"border-purple-600", // Epic (4)
	"border-orange-600", // Legendary (5)
	"border-red-600", // Artifact (6)
	"border-yellow-600", // Heirloom (7)
];

const qualityColors = [
	"text-gray-400", // Poor (0)
	"text-stone-400", // Common (1)
	"text-green-400", // Uncommon (2)
	"text-blue-400", // Rare (3)
	"text-purple-400", // Epic (4)
	"text-orange-400", // Legendary (5)
	"text-red-400", // Artifact (6)
	"text-yellow-400", // Heirloom (7)
];

export function BagSelectionDialog({
	open,
	onOpenChange,
	onBagSelect,
	currentBagTypeId,
}: BagSelectionDialogProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedBagTypeId, setSelectedBagTypeId] = useState<string | null>(
		currentBagTypeId || null,
	);

	const filteredBags = BAG_TYPES.filter(
		(bag) =>
			bag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			bag.description.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleBagClick = (bagTypeId: string) => {
		setSelectedBagTypeId(bagTypeId);
	};

	const handleConfirm = () => {
		if (selectedBagTypeId !== null) {
			onBagSelect(selectedBagTypeId);
		}
	};

	const handleCancel = () => {
		setSelectedBagTypeId(currentBagTypeId || null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] bg-stone-900 border-stone-700">
				<DialogHeader>
					<DialogTitle className="text-stone-100">
						Select Bag for Slot
					</DialogTitle>
					<DialogDescription className="text-stone-400">
						Choose a bag to assign to this bank slot. The bag will increase your
						total storage capacity.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						placeholder="Search bags..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="bg-stone-800 border-stone-700 text-stone-100"
					/>

					<div className="max-h-96 overflow-y-auto">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{filteredBags.map((bag) => (
								<BagOption
									key={bag.id}
									bag={bag}
									isSelected={selectedBagTypeId === bag.id}
									onClick={() => handleBagClick(bag.id)}
								/>
							))}
						</div>
					</div>

					{selectedBagTypeId &&
						(() => {
							const selectedBag = BAG_TYPES.find(
								(b) => b.id === selectedBagTypeId,
							);
							return selectedBag ? (
								<div className="bg-stone-800 border border-stone-700 rounded-lg p-3">
									<div className="flex items-center gap-3">
										<Image
											src={`https://wow.zamimg.com/images/wow/icons/large/${selectedBag.itemId}.jpg`}
											alt={selectedBag.name}
											className="w-12 h-12 rounded border-2 border-stone-600"
											width={48}
											height={48}
											onError={(e) => {
												e.currentTarget.src = "/wow-item-icon.jpg";
											}}
										/>
										<div>
											<div className="text-stone-100 font-medium">
												{selectedBag.name}
											</div>
											<div className="text-stone-400 text-sm">
												{selectedBag.description}
											</div>
											<div className="text-stone-500 text-xs">
												+{selectedBag.slots} slots
											</div>
										</div>
									</div>
								</div>
							) : null;
						})()}

					<div className="flex justify-end gap-2">
						<Button
							onClick={handleCancel}
							variant="outline"
							className="border-stone-700 text-stone-300 hover:bg-stone-800"
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={selectedBagTypeId === null}
							className="bg-amber-600 hover:bg-amber-700 text-white"
						>
							Assign Bag
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface BagOptionProps {
	bag: BagType;
	isSelected: boolean;
	onClick: () => void;
}

function BagOption({ bag, isSelected, onClick }: BagOptionProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
				"bg-stone-800 hover:bg-stone-700",
				isSelected
					? "border-amber-500 bg-amber-900/20"
					: "border-stone-700 hover:border-stone-600",
			)}
		>
			<Image
				src={`https://wow.zamimg.com/images/wow/icons/large/${bag.itemId}.jpg`}
				alt={bag.name}
				className={cn(
					"w-10 h-10 rounded border-2 flex-shrink-0",
					qualityBorders[bag.quality] || "border-stone-600",
				)}
				width={40}
				height={40}
				onError={(e) => {
					e.currentTarget.src = "/wow-item-icon.jpg";
				}}
			/>
			<div className="flex-1 min-w-0">
				<div
					className={cn(
						"font-medium text-sm",
						qualityColors[bag.quality] || "text-stone-300",
					)}
				>
					{bag.name}
				</div>
				<div className="text-stone-500 text-xs">{bag.description}</div>
				{bag.slots > 0 && (
					<div className="text-stone-400 text-xs font-medium">
						+{bag.slots} slots
					</div>
				)}
			</div>
		</button>
	);
}
