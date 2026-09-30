import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BankViewer } from "@/components/bank-viewer";
import { Button } from "@/components/ui/button";
import { createBankService } from "@/lib/bank-service";
import { supabaseBankStore } from "@/lib/bank-store.supabase";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_GAME_MODE } from "@/lib/types";

export default async function BankViewPage({
	params,
}: {
	params: Promise<{ shareCode: string }>;
}) {
	const { shareCode } = await params;
	const bank = await createBankService(
		supabaseBankStore(await createClient(), DEFAULT_GAME_MODE),
	).load(shareCode);

	if (!bank) {
		notFound();
	}

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
					initialItems={bank.items}
					bankName={bank.name}
					passwordHash={bank.passwordHash}
					initialAdminNotes={bank.adminNotes}
					initialGold={bank.gold}
					initialSilver={bank.silver}
					initialCopper={bank.copper}
					initialGameMode={bank.gameMode}
				/>
			</div>
		</main>
	);
}
