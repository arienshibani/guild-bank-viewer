import { ArrowLeft, Calendar, ExternalLink, GitBranch } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GitHubRelease {
	id: number;
	tag_name: string;
	name: string;
	body: string;
	published_at: string;
	html_url: string;
	prerelease: boolean;
	draft: boolean;
}

async function getGitHubReleases(): Promise<GitHubRelease[]> {
	try {
		const response = await fetch(
			"https://api.github.com/repos/arienshibani/classic-guild-bank/releases",
			{
				next: { revalidate: 3600 }, // Cache for 1 hour
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch releases");
		}

		const releases: GitHubRelease[] = await response.json();

		// Filter out drafts and sort by published date (newest first)
		return releases
			.filter((release) => !release.draft)
			.sort(
				(a, b) =>
					new Date(b.published_at).getTime() -
					new Date(a.published_at).getTime(),
			);
	} catch (error) {
		console.error("Error fetching GitHub releases:", error);
		return [];
	}
}

function formatReleaseDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function parseReleaseBody(body: string): string {
	// Convert markdown-style formatting to HTML-like structure
	// This is a simple parser for basic markdown features
	return body
		.split("\n")
		.map((line) => {
			// Handle headers
			if (line.startsWith("### ")) {
				return `<h3 class="text-lg font-semibold text-amber-100 mt-4 mb-2">${line.slice(4)}</h3>`;
			}
			if (line.startsWith("## ")) {
				return `<h2 class="text-xl font-bold text-amber-100 mt-6 mb-3">${line.slice(3)}</h2>`;
			}
			if (line.startsWith("# ")) {
				return `<h1 class="text-2xl font-bold text-amber-100 mt-8 mb-4">${line.slice(2)}</h1>`;
			}

			// Handle bullet points
			if (line.startsWith("- ") || line.startsWith("* ")) {
				return `<li class="text-stone-300 mb-1">${line.slice(2)}</li>`;
			}

			// Handle empty lines
			if (line.trim() === "") {
				return "<br>";
			}

			// Regular text
			if (line.trim()) {
				return `<p class="text-stone-300 mb-2">${line}</p>`;
			}

			return "";
		})
		.join("");
}

export default async function ChangelogPage() {
	const releases = await getGitHubReleases();

	return (
		<main className="min-h-screen bg-gradient-to-b from-stone-900 to-stone-950 p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Header */}
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
					<h1 className="text-3xl font-bold text-amber-100 flex items-center">
						<GitBranch className="w-8 h-8 mr-3" />
						Changelog
					</h1>
					<div className="w-24" />
				</div>

				{/* Description */}
				<div className="text-center mb-8">
					<p className="text-stone-400 text-lg">
						Latest features, updates and bugfixes.
					</p>
				</div>

				{/* Releases */}
				<div className="space-y-6">
					{releases.length === 0 ? (
						<Card className="bg-stone-800/50 border-stone-700">
							<CardContent className="p-8 text-center">
								<p className="text-stone-400">
									No releases found. Check back later for updates!
								</p>
							</CardContent>
						</Card>
					) : (
						releases.map((release) => (
							<Card
								key={release.id}
								className="bg-stone-800/50 border-stone-700 hover:bg-stone-800/70 transition-colors"
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="text-2xl text-amber-100 mb-2">
												{release.name || release.tag_name}
											</CardTitle>
											<div className="flex items-center gap-4 text-stone-400">
												<div className="flex items-center gap-1">
													<Calendar className="w-4 h-4" />
													<span className="text-sm">
														{formatReleaseDate(release.published_at)}
													</span>
												</div>
												<Badge
													variant="secondary"
													className="bg-stone-700 text-stone-300 border-stone-600"
												>
													{release.tag_name}
												</Badge>
												{release.prerelease && (
													<Badge
														variant="outline"
														className="border-amber-500 text-amber-400"
													>
														Pre-release
													</Badge>
												)}
											</div>
										</div>
										<a
											href={release.html_url}
											target="_blank"
											rel="noopener noreferrer"
											className="p-2 text-stone-400 hover:text-stone-200 transition-colors"
											aria-label="View release on GitHub"
										>
											<ExternalLink className="w-5 h-5" />
										</a>
									</div>
								</CardHeader>
								<CardContent>
									<div
										className="prose prose-invert max-w-none"
										dangerouslySetInnerHTML={{
											__html: parseReleaseBody(release.body),
										}}
									/>
								</CardContent>
							</Card>
						))
					)}
				</div>

				{/* Footer */}
				<div className="text-center pt-8 pb-4">
					<p className="text-stone-500 text-sm">
						Want to contribute or report issues?{" "}
						<a
							href="https://github.com/arienshibani/classic-guild-bank"
							target="_blank"
							rel="noopener noreferrer"
							className="text-amber-400 hover:text-amber-300 transition-colors"
						>
							Visit our GitHub repository
						</a>
					</p>
				</div>
			</div>
		</main>
	);
}
