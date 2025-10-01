"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ItemEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slotNumber: number
  currentItemId?: number
  currentQuantity?: number
  onSave: (slotNumber: number, itemId: number | null, quantity: number) => void
}

export function ItemEditDialog({
  open,
  onOpenChange,
  slotNumber,
  currentItemId,
  currentQuantity,
  onSave,
}: ItemEditDialogProps) {
  const [itemId, setItemId] = useState<string>(currentItemId?.toString() || "")
  const [quantity, setQuantity] = useState<string>(currentQuantity?.toString() || "1")

  useEffect(() => {
    setItemId(currentItemId?.toString() || "")
    setQuantity(currentQuantity?.toString() || "1")
  }, [currentItemId, currentQuantity, open])

  const handleSave = () => {
    const parsedItemId = itemId ? Number.parseInt(itemId) : null
    const parsedQuantity = Number.parseInt(quantity) || 1
    onSave(slotNumber, parsedItemId, parsedQuantity)
    onOpenChange(false)
  }

  const handleRemove = () => {
    onSave(slotNumber, null, 0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-stone-900 border-stone-700 text-stone-100">
        <DialogHeader>
          <DialogTitle className="text-amber-100">Edit Slot {slotNumber + 1}</DialogTitle>
          <DialogDescription className="text-stone-400">
            Enter the WoW Classic item ID and quantity for this slot.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="itemId" className="text-stone-300">
              Item ID
            </Label>
            <Input
              id="itemId"
              type="number"
              placeholder="e.g., 19019"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
            <p className="text-xs text-stone-500">Find item IDs on Wowhead or other WoW databases</p>
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
            <Button variant="destructive" onClick={handleRemove} className="bg-red-900 hover:bg-red-800">
              Remove Item
            </Button>
          )}
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
