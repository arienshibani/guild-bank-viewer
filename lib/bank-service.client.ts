import { createBankService } from "@/lib/bank-service";
import { supabaseBankStore } from "@/lib/bank-store.supabase";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_GAME_MODE } from "@/lib/types";

/** BankService backed by the browser Supabase client. */
export function createBrowserBankService() {
	return createBankService(supabaseBankStore(createClient(), DEFAULT_GAME_MODE));
}
