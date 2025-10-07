"use client";

import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { GameMode } from "@/lib/types";

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
	gameMode?: GameMode;
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

// Process tooltip HTML to add WoW-like styling and structure
function processTooltipHTML(html: string): string {
	let processedHTML = html;

	// Add base CSS styles for WoW-like appearance
	const baseStyles = `
		<style>
			.wow-tooltip { color: #fff; }
			.wow-tooltip table { width: 100%; border-collapse: collapse; }
			.wow-tooltip td { padding: 0; vertical-align: top; color: #fff; }
			.wow-tooltip th { text-align: right; padding: 0; color: #fff; }
			.wow-tooltip .q3 { color: #0070dd; font-weight: bold; }
			.wow-tooltip .q2 { color: #1eff00; }
			.wow-tooltip .q1 { color: #fff; }
			.wow-tooltip .q { color: #ffd100; }
			.wow-tooltip .whtt-sellprice { color: #fff; }
			.wow-tooltip a { color: #1eff00; text-decoration: none; }
			.wow-tooltip a:hover { text-decoration: underline; }
			.wow-tooltip span:not(.q):not(.q1):not(.q2):not(.q3) { color: #fff; }
			.wow-tooltip .max-stack { color: #9d9d9d !important; }
		</style>
	`;

	// Wrap the content in a WoW tooltip container
	processedHTML = `<div class="wow-tooltip">${processedHTML}</div>`;

	// Style item level text with WoW yellow color
	processedHTML = processedHTML.replace(
		/Item Level <!--ilvl-->(\d+)/g,
		'<span class="q">Item Level $1</span>',
	);

	// Style on-hit effects and similar green text with WoW green color
	processedHTML = processedHTML.replace(
		/<span id="useText\d+" class="q2">([^<]*(?:<[^>]*>[^<]*<\/[^>]*>[^<]*)*)<\/span>/g,
		'<span class="q2">$1</span>',
	);

	// Add currency icons to money values
	// Replace moneysilver spans with icon + value
	processedHTML = processedHTML.replace(
		/<span class="moneysilver">(\d+)<\/span>/g,
		'<span class="inline-flex items-center gap-1"><span class="w-3 h-3 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-full border border-gray-200 inline-block"></span>$1</span>',
	);

	// Replace moneycopper spans with icon + value
	processedHTML = processedHTML.replace(
		/<span class="moneycopper">(\d+)<\/span>/g,
		'<span class="inline-flex items-center gap-1"><span class="w-3 h-3 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-full border border-orange-400 inline-block"></span>$1</span>',
	);

	// Replace moneygold spans with icon + value (if they exist)
	processedHTML = processedHTML.replace(
		/<span class="moneygold">(\d+)<\/span>/g,
		'<span class="inline-flex items-center gap-1"><span class="w-3 h-3 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full border border-yellow-300 inline-block"></span>$1</span>',
	);

	// Style Max Stack text with gray color
	processedHTML = processedHTML.replace(
		/>([^<]*Max Stack[^<]*)</g,
		'><span class="max-stack">$1</span><',
	);

	// Remove the outer table structure that we don't need for our layout
	processedHTML = processedHTML.replace(/^<tbody><tr><td>/, "");
	processedHTML = processedHTML.replace(
		/<\/td><th[^>]*><\/th><\/tr><tr><th[^>]*><\/th><th[^>]*><\/th><\/tr><\/tbody>$/,
		"",
	);

	return baseStyles + processedHTML;
}

export function ItemTooltip({ itemId, children, gameMode }: ItemTooltipProps) {
	const [itemData, setItemData] = useState<ItemData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTooltip, setShowTooltip] = useState(false);
	const [tooltipPosition, setTooltipPosition] = useState<{
		top: boolean;
		left: boolean;
		transform: string;
	}>({ top: false, left: false, transform: "translateX(-50%)" });
	const [isClient, setIsClient] = useState(false);

	const tooltipRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	// Set client-side flag
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Calculate tooltip position to keep it within viewport
	useEffect(() => {
		if (!showTooltip || !tooltipRef.current || !triggerRef.current || !isClient)
			return;

		const tooltip = tooltipRef.current;
		const trigger = triggerRef.current;
		const rect = trigger.getBoundingClientRect();
		const tooltipRect = tooltip.getBoundingClientRect();

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const margin = 8; // Minimum margin from viewport edge

		// Calculate horizontal position
		let left = false;
		let transform = "translateX(-50%)";

		// Check if tooltip would overflow on the right
		if (rect.left + tooltipRect.width / 2 > viewportWidth - margin) {
			left = true;
			transform = "translateX(-100%)";
		}
		// Check if tooltip would overflow on the left
		else if (rect.left - tooltipRect.width / 2 < margin) {
			left = false;
			transform = "translateX(0%)";
		}

		// Calculate vertical position
		let top = false;

		// Check if tooltip would overflow at the bottom
		if (rect.bottom + tooltipRect.height + margin > viewportHeight) {
			top = true; // Show above the trigger
		}

		setTooltipPosition({ top, left, transform });
	}, [showTooltip, isClient]);

	useEffect(() => {
		if (!showTooltip || !itemId) return;

		const fetchItemData = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Use our API route to fetch item data with game mode parameter
				const gameModeParam = gameMode
					? `?gameMode=${encodeURIComponent(gameMode)}`
					: "";
				const response = await fetch(`/api/item/${itemId}${gameModeParam}`);

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
	}, [itemId, showTooltip, gameMode]);

	return (
		<div className="relative inline-block">
			<button
				ref={triggerRef}
				type="button"
				onMouseEnter={() => setShowTooltip(true)}
				onMouseLeave={() => setShowTooltip(false)}
				className="border-none bg-transparent p-0 cursor-pointer"
			>
				{children}
			</button>

			{showTooltip && (
				<div
					ref={tooltipRef}
					className={`absolute z-50 pointer-events-none ${
						isClient && tooltipPosition.top
							? "bottom-full mb-2"
							: "top-full mt-2"
					} ${isClient && tooltipPosition.left ? "right-0" : "left-1/2"}`}
					style={
						isClient ? { transform: tooltipPosition.transform } : undefined
					}
				>
					<div
						className={`bg-gradient-to-b from-stone-900 to-stone-950 border-2 rounded-lg shadow-2xl p-3 min-w-[280px] max-w-[90vw] sm:min-w-[400px] sm:max-w-[550px] ${
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
							<div className="text-xs sm:text-sm">
								{/* Main tooltip content using WoW-like structure */}
								<div
									dangerouslySetInnerHTML={{
										__html: processTooltipHTML(itemData.description || ""),
									}}
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
