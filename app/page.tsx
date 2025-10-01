import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-stone-900 to-stone-950">
      <div className="max-w-2xl text-center space-y-8">
        <div className="flex justify-center">
          <Package className="w-24 h-24 text-amber-500" />
        </div>
        <h1 className="text-5xl font-bold text-amber-100">Guild Bank Viewer</h1>
        <p className="text-xl text-stone-400">
          Manage and share your WoW Classic guild bank contents with your guildmates
        </p>
        <div className="flex flex-col gap-4 items-center">
          <Link href="/bank/new">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
              Create New Bank
            </Button>
          </Link>

          <div className="w-full max-w-md">
            <form action="/bank" method="get" className="flex gap-2">
              <Input
                name="code"
                placeholder="Enter share code"
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

        <div className="pt-8 text-sm text-stone-500">
          <p>Create a bank, add items using WoW item IDs, and share the link with your guild.</p>
          <p className="mt-2">Default edit password: admin</p>
        </div>
      </div>
    </main>
  )
}
