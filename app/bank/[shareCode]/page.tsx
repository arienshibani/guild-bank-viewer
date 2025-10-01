import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BankViewer } from "@/components/bank-viewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

interface GuildBank {
	id: string;
	name: string;
	share_code: string;
	password_hash: string;
	admin_notes: string;
	created_at: string;
}

export default async function BankViewPage({
	params,
}: {
	params: Promise<{ shareCode: string }>;
}) {
	const { shareCode } = await params;
	const supabase = await createClient();

	// Fetch the guild bank
	const { data: bankData, error: bankError } = await supabase
		.from("guild_banks")
		.select("*")
		.eq("share_code", shareCode)
		.single();

	if (bankError || !bankData) {
		notFound();
	}

	const bank = bankData as GuildBank;

	// Fetch all items for this bank
	const { data: itemsData } = await supabase
		.from("bank_items")
		.select("*")
		.eq("guild_bank_id", bank.id)
		.order("slot_number");

	const items = (itemsData as BankItem[]) || [];

	return (
		<main className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-950 p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<Link href="/">
						<Button
							variant="ghost"
							className="text-stone-400 hover:text-stone-100"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back
						</Button>
					</Link>
					<h1 className="text-3xl font-bold text-amber-100">{bank.name}</h1>
					<div className="w-24" />
				</div>

				<BankViewer
					bankId={bank.id}
					shareCode={shareCode}
					initialItems={items}
					bankName={bank.name}
					passwordHash={bank.password_hash}
					initialAdminNotes={bank.admin_notes || ""}
					initialGold={bank.gold || 0}
					initialSilver={bank.silver || 0}
					initialCopper={bank.copper || 0}
				/>
			</div>
		</main>
	);
}
