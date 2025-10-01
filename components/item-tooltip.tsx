"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ItemData {
	name: string;
	quality: number;
	level?: number;
	classs?: string;
	subclass?: string;
	icon?: string;
	description?: string;
	stats?: string[];
	salePrice?: { gold: number; silver: number; copper: number };
	category?: string;
}

interface ItemTooltipProps {
	itemId: number;
	children: React.ReactNode;
}

const qualityColors = [
	"text-gray-400", // Poor (0)
	"text-white", // Common (1)
	"text-green-400", // Uncommon (2)
	"text-blue-400", // Rare (3)
	"text-purple-400", // Epic (4)
	"text-orange-400", // Legendary (5)
	"text-red-400", // Artifact (6)
	"text-yellow-400", // Heirloom (7)
];

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

export function ItemTooltip({ itemId, children }: ItemTooltipProps) {
	const [itemData, setItemData] = useState<ItemData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTooltip, setShowTooltip] = useState(false);

	useEffect(() => {
		if (!showTooltip || !itemId) return;

		const fetchItemData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Use our API route to fetch item data
				const response = await fetch(`/api/item/${itemId}`);

				if (!response.ok) {
					throw new Error("Failed to fetch item data");
				}

				const data = await response.json();
				setItemData(data);
			} catch (err) {
				console.error("Error fetching item data:", err);
				setError("Failed to load item data");
			} finally {
				setIsLoading(false);
			}
		};

		fetchItemData();
	}, [itemId, showTooltip]);

	return (
		<div className="relative inline-block">
			<button
				type="button"
				onMouseEnter={() => setShowTooltip(true)}
				onMouseLeave={() => setShowTooltip(false)}
				className="border-none bg-transparent p-0 cursor-pointer"
			>
				{children}
			</button>

			{showTooltip && (
				<div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none">
					<div
						className={`bg-gradient-to-b from-stone-900 to-stone-950 border-2 rounded-lg shadow-2xl p-3 min-w-[400px] max-w-[550px] ${
							itemData
								? qualityBorders[itemData.quality] || "border-stone-700"
								: "border-stone-700"
						}`}
					>
						{isLoading && (
							<div className="flex items-center justify-center py-4">
								<Loader2 className="w-5 h-5 animate-spin text-amber-500" />
							</div>
						)}

						{error && <div className="text-red-400 text-sm">{error}</div>}

						{itemData && (
							<div className="space-y-2">
								<div
									className={`font-bold text-base ${qualityColors[itemData.quality] || "text-white"}`}
								>
									{itemData.name}
								</div>

								{itemData.level && (
									<div className="text-yellow-400 text-sm">
										Item Level {itemData.level}
									</div>
								)}

								{itemData.category && (
									<div className="text-stone-300 text-sm">
										{itemData.category}
									</div>
								)}

								{itemData.stats && itemData.stats.length > 0 && (
									<div className="space-y-1">
										{itemData.stats.map((stat) => (
											<div key={stat} className="text-green-400 text-sm">
												{stat}
											</div>
										))}
									</div>
								)}

								{itemData.description && (
									<div
										className="text-stone-400 text-sm italic"
										dangerouslySetInnerHTML={{ __html: itemData.description }}
									/>
								)}

								{itemData.salePrice && (
									<div className="flex items-center gap-1 text-yellow-400 text-sm">
										<span>Sells for:</span>
										{itemData.salePrice.gold > 0 && (
											<span className="flex items-center gap-1">
												<span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
												{itemData.salePrice.gold}
											</span>
										)}
										{itemData.salePrice.silver > 0 && (
											<span className="flex items-center gap-1">
												<span className="w-3 h-3 bg-gray-400 rounded-full"></span>
												{itemData.salePrice.silver}
											</span>
										)}
										{itemData.salePrice.copper > 0 && (
											<span className="flex items-center gap-1">
												<span className="w-3 h-3 bg-orange-600 rounded-full"></span>
												{itemData.salePrice.copper}
											</span>
										)}
									</div>
								)}

								<div className="text-xs text-stone-500 pt-1 border-t border-stone-700 mt-2">
									Item ID: {itemId}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
