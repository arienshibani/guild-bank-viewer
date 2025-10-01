"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ItemTooltip } from "./item-tooltip";

interface BankSlotProps {
	slotNumber: number;
	itemId?: number;
	quantity?: number;
	isEditMode: boolean;
	onSlotClick: (slotNumber: number) => void;
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

export function BankSlot({
	slotNumber,
	itemId,
	quantity,
	isEditMode,
	onSlotClick,
}: BankSlotProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [itemQuality, setItemQuality] = useState<number | null>(null);
	const [itemIconName, setItemIconName] = useState<string | null>(null);

	const hasItem = itemId !== undefined && itemId > 0;

	// Fetch item quality and icon name when itemId changes
	useEffect(() => {
		if (!itemId) {
			setItemQuality(null);
			setItemIconName(null);
			return;
		}

		const fetchItemData = async () => {
			try {
				const response = await fetch(`/api/item/${itemId}`);

				if (response.ok) {
					const data = await response.json();
					const quality = data.quality || 0;
					const iconName = data.iconName || null;
					setItemQuality(quality);
					setItemIconName(iconName);
				}
			} catch {
				// Silently handle errors - item will just show without quality border
			}
		};

		fetchItemData();
	}, [itemId]);

	const slotContent = (
		<button
			type="button"
			onClick={() => onSlotClick(slotNumber)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className={cn(
				"relative w-10 h-10 sm:w-12 sm:h-12 rounded border-2 transition-all",
				"bg-gradient-to-br from-stone-800 to-stone-900",
				hasItem && itemQuality !== null
					? qualityBorders[itemQuality] || "border-stone-700"
					: "border-stone-700",
				"hover:border-amber-600",
				isEditMode && "cursor-pointer",
				!isEditMode && !hasItem && "cursor-default",
				isHovered && "shadow-lg shadow-amber-500/20",
			)}
		>
			{hasItem && (
				<>
					<Image
						src={
							itemIconName
								? `https://wow.zamimg.com/images/wow/icons/large/${itemIconName}.jpg`
								: `https://wow.zamimg.com/images/wow/icons/large/${itemId}.jpg`
						}
						alt={`Item ${itemId}`}
						className="w-full h-full rounded object-cover"
						width={40}
						height={40}
						onError={(e) => {
							// Fallback to placeholder if image fails to load
							e.currentTarget.src = "/wow-item-icon.jpg";
						}}
					/>
					{quantity && quantity > 1 && (
						<span className="absolute bottom-0 right-0 px-0.5 sm:px-1 text-xs font-bold text-white bg-black/70 rounded-tl">
							{quantity}
						</span>
					)}
				</>
			)}
			{!hasItem && (
				<div className="w-full h-full flex items-center justify-center">
					<div className="w-6 h-6 sm:w-8 sm:h-8 border border-stone-700/50 rounded" />
				</div>
			)}
		</button>
	);

	if (hasItem && itemId) {
		return <ItemTooltip itemId={itemId}>{slotContent}</ItemTooltip>;
	}

	return slotContent;
}
