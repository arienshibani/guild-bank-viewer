"use client";

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
}

export function BankGrid({ items, isEditMode, onSlotClick }: BankGridProps) {
	// Create a map of slot number to item for quick lookup
	const itemMap = new Map(items.map((item) => [item.slot_number, item]));

	// Generate 28 slots
	const slots = Array.from({ length: 28 }, (_, i) => {
		const item = itemMap.get(i);
		return {
			slotNumber: i,
			itemId: item?.item_id,
			quantity: item?.quantity,
		};
	});

	return (
		<div className="relative p-3 sm:p-6 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950 rounded-lg border-2 sm:border-4 border-stone-700 shadow-2xl">
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
					/>
				))}
			</div>
		</div>
	);
}
