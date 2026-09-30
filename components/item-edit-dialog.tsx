"use client";

import { Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useItem } from "@/hooks/use-item";
import { useItemSearch } from "@/hooks/use-item-search";
import { DEFAULT_GAME_MODE, GAME_MODE_LABELS, type GameMode } from "@/lib/types";
import type { ItemSearchResult } from "@/lib/wowhead";

const qualityText = [
	"text-gray-400", // Poor
	"text-stone-100", // Common
	"text-green-400", // Uncommon
	"text-blue-400", // Rare
	"text-purple-400", // Epic
	"text-orange-400", // Legendary
	"text-red-400", // Artifact
	"text-yellow-400", // Heirloom
];

const iconUrl = (icon: string | null) =>
	icon
		? `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`
		: "/wow-item-icon.jpg";

function ItemRow({
	item,
	onClick,
}: {
	item: Pick<ItemSearchResult, "id" | "name" | "icon" | "quality" | "subtitle">;
	onClick?: () => void;
}) {
	const content = (
		<>
			<Image
				src={iconUrl(item.icon)}
				alt=""
				width={32}
				height={32}
				className="w-8 h-8 rounded border border-stone-700 shrink-0"
			/>
			<span className="min-w-0 flex-1 text-left">
				<span
					className={`block truncate text-sm font-medium ${qualityText[item.quality] ?? qualityText[1]}`}
				>
					{item.name}
				</span>
				<span className="block truncate text-xs text-stone-500">
					{item.subtitle ? `${item.subtitle} · ` : ""}ID {item.id}
				</span>
			</span>
		</>
	);
	if (!onClick) return <div className="flex items-center gap-3">{content}</div>;
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-3 rounded px-2 py-1.5 hover:bg-stone-800 focus:bg-stone-800 focus:outline-none"
		>
			{content}
		</button>
	);
}

interface ItemEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	slotNumber: number;
	currentItemId?: number;
	currentQuantity?: number;
	gameMode?: GameMode;
	onSave: (slotNumber: number, itemId: number | null, quantity: number) => void;
}

export function ItemEditDialog({
	open,
	onOpenChange,
	slotNumber,
	currentItemId,
	currentQuantity,
	gameMode = DEFAULT_GAME_MODE,
	onSave,
}: ItemEditDialogProps) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [picked, setPicked] = useState<ItemSearchResult | null>(null);
	const [query, setQuery] = useState("");
	const [quantity, setQuantity] = useState("1");

	useEffect(() => {
		if (!open) return;
		setSelectedId(currentItemId ?? null);
		setPicked(null);
		setQuery("");
		setQuantity(currentQuantity?.toString() || "1");
	}, [open, currentItemId, currentQuantity]);

	const { results, isSearching, error } = useItemSearch(query, gameMode);

	// Power users can still type a raw item ID.
	const debouncedQuery = useDebouncedValue(query.trim(), 300);
	const typedId =
		/^\d+$/.test(query.trim()) && query.trim() === debouncedQuery
			? Number(debouncedQuery)
			: undefined;
	const typed = useItem(typedId, gameMode);

	// Details for the selected item: from the search result, else look it up (existing items).
	const selected = useItem(picked ? undefined : (selectedId ?? undefined), gameMode);
	const selectedRow = selectedId
		? (picked ?? {
				id: selectedId,
				name: selected.item?.name ?? `Item ${selectedId}`,
				icon: selected.item?.iconName ?? null,
				quality: selected.item?.quality ?? 1,
				subtitle: selected.item?.category ?? null,
			})
		: null;

	const choose = (item: ItemSearchResult) => {
		setPicked(item);
		setSelectedId(item.id);
		setQuery("");
	};

	const handleSave = () => {
		if (selectedId === null) return;
		onSave(slotNumber, selectedId, Number.parseInt(quantity, 10) || 1);
		onOpenChange(false);
	};

	const handleRemove = () => {
		onSave(slotNumber, null, 0);
		onOpenChange(false);
	};

	const trimmed = query.trim();
	const showEmpty =
		trimmed.length >= 2 && !isSearching && !error && results.length === 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-stone-900 border-stone-700 text-stone-100">
				<DialogHeader>
					<DialogTitle className="text-amber-100">
						Edit Slot {slotNumber + 1}
					</DialogTitle>
					<DialogDescription className="text-stone-400">
						Search for an item from WoW {GAME_MODE_LABELS[gameMode]}.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="itemSearch" className="text-stone-300">
							Item
						</Label>
						{selectedRow ? (
							<div className="flex items-center gap-2 rounded-md border border-stone-700 bg-stone-800 px-2 py-1.5">
								<div className="min-w-0 flex-1">
									<ItemRow item={selectedRow} />
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setSelectedId(null);
										setPicked(null);
									}}
									className="text-stone-400 hover:text-stone-100"
									aria-label="Change item"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						) : (
							<>
								<div className="relative">
									<Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
									<Input
										id="itemSearch"
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="Search by name, e.g. Thunderfury"
										autoComplete="off"
										className="bg-stone-800 border-stone-700 text-stone-100 pl-9"
									/>
									{isSearching && (
										<Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-amber-500" />
									)}
								</div>
								{typedId !== undefined && typed.item && (
									<div className="rounded-md border border-stone-700 bg-stone-950 p-1">
										<ItemRow
											item={{
												id: typedId,
												name: typed.item.name,
												icon: typed.item.iconName,
												quality: typed.item.quality,
												subtitle: "Use this item ID",
											}}
											onClick={() =>
												choose({
													id: typedId,
													name: typed.item?.name ?? `Item ${typedId}`,
													icon: typed.item?.iconName ?? null,
													quality: typed.item?.quality ?? 1,
													subtitle: typed.item?.category ?? null,
												})
											}
										/>
									</div>
								)}
								{results.length > 0 && (
									<div className="max-h-60 overflow-y-auto rounded-md border border-stone-700 bg-stone-950 p-1">
										{results.map((item) => (
											<ItemRow
												key={item.id}
												item={item}
												onClick={() => choose(item)}
											/>
										))}
									</div>
								)}
								{showEmpty && typedId === undefined && (
									<p className="text-xs text-stone-500">
										No {GAME_MODE_LABELS[gameMode]} items match "{trimmed}".
									</p>
								)}
								{error && <p className="text-xs text-red-400">{error}</p>}
								{!trimmed && (
									<p className="text-xs text-stone-500">
										Type at least 2 letters. You can also paste an item ID.
									</p>
								)}
							</>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="quantity" className="text-stone-300">
							Quantity
						</Label>
						<Input
							id="quantity"
							type="number"
							min="1"
							placeholder="1"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							className="bg-stone-800 border-stone-700 text-stone-100"
						/>
					</div>
				</div>
				<DialogFooter className="gap-2">
					{currentItemId && (
						<Button
							variant="destructive"
							onClick={handleRemove}
							className="bg-red-900 hover:bg-red-800"
						>
							Remove Item
						</Button>
					)}
					<Button
						onClick={handleSave}
						disabled={selectedId === null}
						className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
					>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
