import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Guild Bank Viewer",
	description: "Share and manager your guild bank with ease.",
	themeColor: "#1A1A1A",
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
	},
	generator: "v0.app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
