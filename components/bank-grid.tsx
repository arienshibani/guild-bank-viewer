"use client";

import type { BankSlotConfig, GameMode } from "@/lib/types";
import { BAG_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BankSlot } from "./bank-slot";

interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

interface BankGridProps {
	items: BankItem[];
	isEditMode: boolean;
	onSlotClick: (slotNumber: number) => void;
	gameMode?: GameMode;
	slotConfigs?: BankSlotConfig[];
}

export function BankGrid({
	items,
	isEditMode,
	onSlotClick,
	gameMode,
	slotConfigs = [],
}: BankGridProps) {
	// Calculate total slots based on bag configuration
	const getTotalSlots = () => {
		const baseSlots = 28;
		const bagSlots = slotConfigs.reduce((total, config) => {
			const bagType = BAG_TYPES.find((bag) => bag.id === config.bagTypeId);
			return total + (bagType?.slots || 0);
		}, 0);
		return baseSlots + bagSlots;
	};

	const totalSlots = getTotalSlots();

	// Create a map of slot number to item for quick lookup
	const itemMap = new Map(items.map((item) => [item.slot_number, item]));

	// Generate slots based on total capacity
	const slots = Array.from({ length: totalSlots }, (_, i) => {
		const item = itemMap.get(i);
		return {
			slotNumber: i,
			itemId: item?.item_id,
			quantity: item?.quantity,
		};
	});

	return (
		<div
			className={cn(
				"relative p-3 sm:p-6 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 rounded-lg border-2 sm:border-4 shadow-2xl",
				isEditMode ? "border-green-200" : "border-stone-700",
			)}
		>
			<div className="absolute inset-0 bg-[url('/stone-texture.png')] opacity-5 rounded-lg" />
			<div className="relative grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-2">
				{slots.map((slot) => (
					<BankSlot
						key={slot.slotNumber}
						slotNumber={slot.slotNumber}
						itemId={slot.itemId}
						quantity={slot.quantity}
						isEditMode={isEditMode}
						onSlotClick={onSlotClick}
						gameMode={gameMode}
					/>
				))}
			</div>
		</div>
	);
}
