"use client";

import { PiggyBank, StarsIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { siGithub } from "simple-icons";
import { BankGrid } from "@/components/bank-grid";
import { MoneyDisplay } from "@/components/money-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LAST_BANK_CODE_KEY = "guild-bank-viewer-last-code";

// Example items for the demo grid
const baseExampleItems = [
	{ item_id: 6657, quantity: 20 }, // Savory Deviate Delight
	{ item_id: 6657, quantity: 12 }, // Savory Deviate Delight
	{ item_id: 14047, quantity: 6 }, // Runecloth
	{ item_id: 14047, quantity: 20 }, // Runecloth
	{ item_id: 14047, quantity: 14 }, // Runecloth
	{ item_id: 13444, quantity: 20 }, // Major Healing Potion
	{ item_id: 3858, quantity: 12 }, // Blood of the Mountain
	{ item_id: 13928, quantity: 8 }, // Grilled squid
	{ item_id: 18284, quantity: 7 }, // Kreegs stout beatdown
	{ item_id: 14551, quantity: 1 }, // Edge masters handguards
	{ item_id: 16022, quantity: 1 }, // Mechanical dragonling
	{ item_id: 13446, quantity: 20 }, // Healing potion
	{ item_id: 13446, quantity: 20 }, // Healing potion
	{ item_id: 12811, quantity: 20 }, // righteous orb
	{ item_id: 18531, quantity: 1 }, // Corehound tooth,
	{ item_id: 1482, quantity: 1 },
	{ item_id: 13468, quantity: 20 }, // Major healing potion
	{ item_id: 16203, quantity: 16 }, // enchanting stuff
	{ item_id: 16204, quantity: 20 }, // enchanting stuff
];

// randomly remove 6 items from the above list to simulate a more realistic bank

baseExampleItems.splice(Math.floor(Math.random() * baseExampleItems.length), 6);

// Function to generate random slot numbers
const generateRandomSlots = (itemCount: number, maxSlot: number = 20) => {
	const slots = new Set<number>();
	while (slots.size < itemCount) {
		slots.add(Math.floor(Math.random() * (maxSlot + 1)));
	}
	return Array.from(slots);
};

export default function Home() {
	const [bankCode, setBankCode] = useState("");
	const [exampleItems, setExampleItems] = useState<
		Array<{ slot_number: number; item_id: number; quantity: number }>
	>([]);
	const [isGridLoaded, setIsGridLoaded] = useState(false);
	const router = useRouter();

	// Load last entered bank code from localStorage
	useEffect(() => {
		const lastCode = localStorage.getItem(LAST_BANK_CODE_KEY);
		if (lastCode) {
			setBankCode(lastCode);
		}
	}, []);

	// Generate random example items on component mount
	useEffect(() => {
		const randomSlots = generateRandomSlots(baseExampleItems.length, 20);
		const itemsWithRandomSlots = baseExampleItems.map((item, index) => ({
			...item,
			slot_number: randomSlots[index],
		}));
		setExampleItems(itemsWithRandomSlots);
	}, []);

	// Wait for items to load their data, then fade in the grid
	useEffect(() => {
		if (exampleItems.length > 0) {
			// Give items time to load their data (icons, quality, etc.)
			const timer = setTimeout(() => {
				setIsGridLoaded(true);
			}, 1000); // 1 second should be enough for most items to load

			return () => clearTimeout(timer);
		}
	}, [exampleItems]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (bankCode.trim()) {
			// Save the bank code to localStorage
			localStorage.setItem(LAST_BANK_CODE_KEY, bankCode.trim());
			// Navigate to the bank page
			router.push(`/bank/${bankCode.trim()}`);
		}
	};

	return (
		<main className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-950 relative">
			{/* Header Section */}
			<div className="flex flex-col items-center justify-center p-8 pt-16">
				<div className="max-w-2xl text-center space-y-10">
					<div className="flex justify-center"></div>
					<h1 className="text-5xl font-bold text-amber-100">
						Guild Bank Viewer{" "}
						<PiggyBank className="inline-block w-10 h-10 ml-2" />
					</h1>
					<p className="text-xl text-stone-400">
						Setup a sharable view of your guild bank contents with your
						guildmates.
					</p>
					<div className="flex flex-col gap-4 items-center">
						<Link href="/bank/new">
							<Button
								size="lg"
								className="bg-amber-600 hover:bg-amber-700 text-white"
							>
								Create Guild Bank
								<StarsIcon className="w-4 h-4 ml-2" />
							</Button>
						</Link>

						<p className="text-stone-400">Or enter your code</p>

						<div className="w-full max-w-md pt-2">
							<form onSubmit={handleSubmit} className="flex gap-2">
								<Input
									value={bankCode}
									onChange={(e) => setBankCode(e.target.value)}
									placeholder="Enter guild bank code"
									className="bg-stone-800 border-stone-700 text-stone-100"
									required
								/>
								<Button
									type="submit"
									variant="outline"
									className="border-stone-700 text-stone-300 hover:bg-stone-800 bg-transparent"
								>
									View Bank
								</Button>
							</form>
						</div>
					</div>
				</div>
			</div>

			{/* Example Bank Grid Section */}
			<div className="flex flex-col items-center justify-center p-8 pb-16">
				<div className="max-w-4xl w-full">
					{/* Section Title */}
					<h2
						className={`text-3xl font-bold text-amber-100 text-center mb-6 ${
							isGridLoaded ? "opacity-100" : "opacity-0"
						}`}
					>
						Example Guild Bank
					</h2>
					<div className="text-center mb-8"></div>

					{/* Example Bank Grid with fade animation */}
					<div
						className={`flex justify-center transition-opacity duration-1000 ${
							isGridLoaded ? "opacity-100" : "opacity-0"
						}`}
					>
						<div className="max-w-md">
							<BankGrid
								items={exampleItems}
								isEditMode={false}
								onSlotClick={() => {}} // No-op for demo
							/>
						</div>
					</div>

					{/* Example Money Display with fade animation */}
					<div
						className={`flex justify-center mt-6 transition-opacity duration-1000 ${
							isGridLoaded ? "opacity-100" : "opacity-0"
						}`}
					>
						<MoneyDisplay
							gold={1337}
							silver={69}
							copper={420}
							isEditable={false}
							onMoneyChange={() => {}} // No-op for demo
						/>
					</div>

					{/* Example Admin Notes with fade animation */}
					<div
						className={`max-w-md mx-auto mt-6 transition-opacity duration-1000 ${
							isGridLoaded ? "opacity-100" : "opacity-0"
						}`}
					>
						<div className="space-y-2">
							<div className="text-stone-300 text-sm font-medium">
								Example notes
							</div>
							<div className="bg-stone-800 border border-stone-700 rounded-lg p-3 text-stone-100 whitespace-pre-wrap text-sm">
								🏦 Guild Bank Alt: "Bankmaster" <br /> <br />📅 Last Updated:
								2024-01-15 <br /> <br />🔒 Ask Kungen for withdrawals
							</div>
						</div>
					</div>

					<div
						className={`text-center mt-6 transition-opacity duration-1000 ${
							isGridLoaded ? "opacity-100" : "opacity-0"
						}`}
					>
						<p className="text-sm text-stone-500">
							Hover over items to see detailed tooltips with stats,
							descriptions, and sale prices
						</p>
					</div>
				</div>
			</div>

			{/* GitHub Link */}
			<a
				href="https://github.com/arienshibani/classic-guild-bank/"
				target="_blank"
				rel="noopener noreferrer"
				className="absolute bottom-6 right-6 p-3 bg-stone-800/80 hover:bg-stone-700/80 rounded-full border border-stone-600/50 hover:border-stone-500/50 transition-all duration-200 group"
				aria-label="View source code on GitHub"
			>
				<svg
					className="w-5 h-5 text-stone-400 group-hover:text-stone-300 transition-colors"
					viewBox="0 0 24 24"
					fill="currentColor"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>GitHub</title>
					<path d={siGithub.path} />
				</svg>
			</a>
		</main>
	);
}
