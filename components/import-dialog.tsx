"use client";

import { Download, Upload } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface BankItem {
	slot_number: number;
	item_id: number;
	quantity: number;
}

interface ImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImport: (items: BankItem[]) => void;
	items: BankItem[];
}

export function ImportDialog({
	open,
	onOpenChange,
	onImport,
	items,
}: ImportDialogProps) {
	const [importData, setImportData] = useState("");
	const [isImporting, setIsImporting] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isValidData, setIsValidData] = useState(false);
	const { toast } = useToast();
	const textareaId = useId();

	const validateImportData = (
		data: string,
	): { isValid: boolean; error?: string; items?: BankItem[] } => {
		if (!data.trim()) {
			return { isValid: false, error: "Please enter import data" };
		}

		try {
			// Decode base64 string
			const decodedString = atob(data.trim());

			// Parse JSON
			const parsedData = JSON.parse(decodedString);

			// Validate data structure
			if (!Array.isArray(parsedData)) {
				return { isValid: false, error: "Invalid data string" };
			}

			// Validate each item has required properties
			const validItems = parsedData.filter((item: unknown) => {
				return (
					typeof item === "object" &&
					item !== null &&
					typeof (item as BankItem).slot_number === "number" &&
					typeof (item as BankItem).item_id === "number" &&
					typeof (item as BankItem).quantity === "number" &&
					(item as BankItem).slot_number >= 0 &&
					(item as BankItem).slot_number < 100 && // Assuming max 100 slots
					(item as BankItem).item_id > 0 &&
					(item as BankItem).quantity > 0
				);
			}) as BankItem[];

			if (validItems.length === 0) {
				return { isValid: false, error: "Invalid data string" };
			}

			return { isValid: true, items: validItems };
		} catch {
			return { isValid: false, error: "Invalid data string" };
		}
	};

	const handleDataChange = (value: string) => {
		setImportData(value);

		if (!value.trim()) {
			setValidationError(null);
			setIsValidData(false);
			return;
		}

		const validation = validateImportData(value);
		setValidationError(
			validation.isValid ? null : validation.error || "Invalid data string",
		);
		setIsValidData(validation.isValid);
	};

	const handleImport = async () => {
		if (!isValidData) {
			toast({
				title: "Error",
				description: "Invalid data string",
				variant: "destructive",
			});
			return;
		}

		setIsImporting(true);
		try {
			const validation = validateImportData(importData);
			if (!validation.isValid || !validation.items) {
				throw new Error("Invalid data string");
			}

			// Import the items
			onImport(validation.items);

			toast({
				title: "Success",
				description: `Successfully imported ${validation.items.length} items`,
			});

			// Clear the input and close dialog
			setImportData("");
			setValidationError(null);
			setIsValidData(false);
			onOpenChange(false);
		} catch {
			toast({
				title: "Import Failed",
				description: "Invalid data string",
				variant: "destructive",
			});
		} finally {
			setIsImporting(false);
		}
	};

	const handleCancel = () => {
		setImportData("");
		setValidationError(null);
		setIsValidData(false);
		onOpenChange(false);
	};

	const handleExport = async () => {
		try {
			// Serialize current items and encode to base64
			const json = JSON.stringify(items);
			const encoded = btoa(json);

			// Fill textarea and validate
			handleDataChange(encoded);

			// Copy to clipboard
			await navigator.clipboard.writeText(encoded);

			toast({
				title: "Exported",
				description: "Current items copied to clipboard",
			});
		} catch {
			toast({
				title: "Export Failed",
				description: "Unable to export items",
				variant: "destructive",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-stone-900 border-stone-700 text-stone-100 max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-amber-100">
						Import Datastring
					</DialogTitle>
					<DialogDescription className="text-stone-400">
						Paste a base64 encoded JSON string containing bank item data to
						import multiple items at once. Use the add-on ingame to generate a
						data string.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor={textareaId} className="text-stone-300">
							Base64 Encoded Data
						</Label>
						<Textarea
							id={textareaId}
							placeholder="Paste your base64 encoded bank data here..."
							value={importData}
							onChange={(e) => handleDataChange(e.target.value)}
							className={`bg-stone-800 text-stone-100 min-h-[200px] font-mono text-sm ${
								validationError
									? "border-red-500 focus:border-red-400"
									: isValidData
										? "border-green-500 focus:border-green-400"
										: "border-stone-700 focus:border-stone-600"
							}`}
						/>
						{validationError && (
							<p className="text-xs text-red-400">{validationError}</p>
						)}
						{isValidData && !validationError && (
							<p className="text-xs text-green-400">
								✓ Valid data format detected
							</p>
						)}
						{!validationError && !isValidData && importData.trim() && (
							<p className="text-xs text-stone-500">
								Expected format: Base64 encoded JSON array of items with
								slot_number, item_id, and quantity properties
							</p>
						)}
					</div>
				</div>
				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						onClick={handleExport}
						disabled={isImporting}
						className="border-stone-700 text-stone-300"
					>
						<Download className="w-4 h-4 mr-2" />
						Export Items
					</Button>
					<Button
						onClick={handleImport}
						disabled={isImporting || !isValidData}
						className="bg-amber-600 hover:bg-amber-700 text-white"
					>
						{isImporting ? (
							"Importing..."
						) : (
							<>
								<Upload className="w-4 h-4 mr-2" /> Import Items
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
