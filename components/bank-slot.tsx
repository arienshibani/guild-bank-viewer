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
			console.log(`[BANK-SLOT] Fetching item data for itemId: ${itemId}`);
			try {
				const response = await fetch(`/api/item/${itemId}`);
				console.log(`[BANK-SLOT] API response status: ${response.status}`);

				if (response.ok) {
					const data = await response.json();
					console.log(`[BANK-SLOT] Received data for item ${itemId}:`, data);

					const quality = data.quality || 0;
					const iconName = data.iconName || null;

					console.log(
						`[BANK-SLOT] Setting quality: ${quality}, iconName: ${iconName}`,
					);
					setItemQuality(quality);
					setItemIconName(iconName);
				} else {
					console.error(
						`[BANK-SLOT] API error: ${response.status} ${response.statusText}`,
					);
				}
			} catch (error) {
				console.error(
					`[BANK-SLOT] Error fetching item data for ${itemId}:`,
					error,
				);
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
				"relative w-12 h-12 rounded border-2 transition-all",
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
						width={48}
						height={48}
						onLoad={() => {
							const finalSrc = itemIconName
								? `https://wow.zamimg.com/images/wow/icons/large/${itemIconName}.jpg`
								: `https://wow.zamimg.com/images/wow/icons/large/${itemId}.jpg`;
							console.log(
								`[BANK-SLOT] Image loaded successfully for item ${itemId}: ${finalSrc}`,
							);
						}}
						onError={(e) => {
							const failedSrc = itemIconName
								? `https://wow.zamimg.com/images/wow/icons/large/${itemIconName}.jpg`
								: `https://wow.zamimg.com/images/wow/icons/large/${itemId}.jpg`;
							console.error(
								`[BANK-SLOT] Image failed to load for item ${itemId}: ${failedSrc}`,
							);
							console.error(
								`[BANK-SLOT] itemIconName: ${itemIconName}, itemId: ${itemId}`,
							);
							// Fallback to placeholder if image fails to load
							e.currentTarget.src = "/wow-item-icon.jpg";
						}}
					/>
					{quantity && quantity > 1 && (
						<span className="absolute bottom-0 right-0 px-1 text-xs font-bold text-white bg-black/70 rounded-tl">
							{quantity}
						</span>
					)}
				</>
			)}
			{!hasItem && (
				<div className="w-full h-full flex items-center justify-center">
					<div className="w-8 h-8 border border-stone-700/50 rounded" />
				</div>
			)}
		</button>
	);

	if (hasItem && itemId) {
		return <ItemTooltip itemId={itemId}>{slotContent}</ItemTooltip>;
	}

	return slotContent;
}
