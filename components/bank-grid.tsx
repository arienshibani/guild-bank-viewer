"use client";

import {
	DndContext,
	type DragEndEvent,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { type BankItem, SLOT_COUNT } from "@/lib/bank-items";
import type { GameMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BankSlot } from "./bank-slot";

interface BankGridProps {
	items: BankItem[];
	isEditMode: boolean;
	onSlotClick: (slotNumber: number) => void;
	/** Called when an item is dragged from one slot to another (edit mode only). */
	onMoveItem?: (from: number, to: number) => void;
	gameMode?: GameMode;
}

export function BankGrid({
	items,
	isEditMode,
	onSlotClick,
	onMoveItem,
	gameMode,
}: BankGridProps) {
	// A small movement threshold keeps plain clicks (open the edit dialog) working;
	// touch needs a short press so scrolling the page still works.
	const sensors = useSensors(
		useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 200, tolerance: 8 },
		}),
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (over && onMoveItem) onMoveItem(Number(active.id), Number(over.id));
	};

	// Create a map of slot number to item for quick lookup
	const itemMap = new Map(items.map((item) => [item.slot_number, item]));

	const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
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
			<DndContext
				sensors={sensors}
				autoScroll={false}
				onDragEnd={handleDragEnd}
			>
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
			</DndContext>
		</div>
	);
}
