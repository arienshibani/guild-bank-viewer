"use client";

import Image from "next/image";
import { useState } from "react";
import { BAG_TYPES, type BankSlotConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BagSelectionDialog } from "./bag-selection-dialog";

interface BagSlotConfigurationProps {
	slotConfigs: BankSlotConfig[];
	onSlotConfigChange: (slotIndex: number, bagTypeId: string) => void;
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

const hoverBorders = [
	"hover:border-white/80", // Poor (0) - white
	"hover:border-green-400", // Common (1) - green
	"hover:border-green-400", // Uncommon (2) - green
	"hover:border-blue-400", // Rare (3) - blue
	"hover:border-purple-400", // Epic (4) - purple
	"hover:border-orange-400", // Legendary (5) - orange
	"hover:border-red-400", // Artifact (6) - red
	"hover:border-yellow-400", // Heirloom (7) - yellow
];

export function BagSlotConfiguration({
	slotConfigs,
	onSlotConfigChange,
}: BagSlotConfigurationProps) {
	const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(
		null,
	);
	const [showBagDialog, setShowBagDialog] = useState(false);

	const handleSlotClick = (slotIndex: number) => {
		setSelectedSlotIndex(slotIndex);
		setShowBagDialog(true);
	};

	const handleBagSelect = (bagTypeId: string) => {
		if (selectedSlotIndex !== null) {
			onSlotConfigChange(selectedSlotIndex, bagTypeId);
		}
		setShowBagDialog(false);
		setSelectedSlotIndex(null);
	};

	const getTotalSlots = () => {
		return slotConfigs.reduce((total, config) => {
			const bagType = BAG_TYPES.find((bag) => bag.id === config.bagTypeId);
			return total + (bagType?.slots || 0);
		}, 28); // Base 28 slots + bag slots
	};

	return (
		<div className="space-y-4">
			<div className="text-stone-300 text-sm">
				Configure your bank bag slots. Each slot can be assigned a bag to
				increase storage capacity.
			</div>

			<div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
				{slotConfigs.map((config) => {
					const bagType = BAG_TYPES.find((bag) => bag.id === config.bagTypeId);
					const hasBag = bagType && bagType.id !== "none";

					return (
						<div key={config.slotIndex} className="space-y-2">
							<div className="text-center text-xs text-stone-400">
								Slot {config.slotIndex + 1}
							</div>
							<button
								type="button"
								onClick={() => handleSlotClick(config.slotIndex)}
								className={cn(
									"relative w-12 h-12 sm:w-16 sm:h-16 rounded border-2 transition-all cursor-pointer",
									"bg-gradient-to-br from-stone-800 to-stone-900",
									hasBag && bagType
										? qualityBorders[bagType.quality] || "border-stone-700"
										: "border-stone-700",
									hasBag && bagType
										? hoverBorders[bagType.quality] || "hover:border-white/80"
										: "hover:border-white/80",
									"hover:shadow-lg hover:shadow-white/30",
								)}
							>
								{hasBag && bagType ? (
									<>
										<Image
											src={`https://wow.zamimg.com/images/wow/icons/large/${bagType.itemId}.jpg`}
											alt={bagType.name}
											className="w-full h-full rounded object-cover"
											width={64}
											height={64}
											onError={(e) => {
												// Fallback to placeholder if image fails to load
												e.currentTarget.src = "/wow-item-icon.jpg";
											}}
										/>
										{bagType.slots > 0 && (
											<span className="absolute bottom-0 right-0 px-1 text-xs font-bold text-white bg-black/70 rounded-tl">
												{bagType.slots}
											</span>
										)}
									</>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<div className="w-8 h-8 border border-stone-700/50 rounded" />
									</div>
								)}
							</button>
							<div className="text-center text-xs text-stone-500">
								{bagType?.name || "Empty"}
							</div>
						</div>
					);
				})}
			</div>

			<div className="bg-stone-800 border border-stone-700 rounded-lg p-3">
				<div className="flex justify-between items-center">
					<span className="text-stone-300 text-sm">Total Bank Slots:</span>
					<span className="text-stone-100 font-semibold">
						{getTotalSlots()}
					</span>
				</div>
				<div className="text-xs text-stone-500 mt-1">
					Base: 28 slots + {getTotalSlots() - 28} from bags
				</div>
			</div>

			<BagSelectionDialog
				open={showBagDialog}
				onOpenChange={setShowBagDialog}
				onBagSelect={handleBagSelect}
				currentBagTypeId={
					selectedSlotIndex !== null
						? slotConfigs[selectedSlotIndex]?.bagTypeId
						: undefined
				}
			/>
		</div>
	);
}
