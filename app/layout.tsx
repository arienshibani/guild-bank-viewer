// import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
	title: "Guild Bank Viewer",
	description: "Share and manager your guild bank with ease.",
	themeColor: "#1A1A1A",
	icons: {
		icon: "/favicon.ico",
		shortcut: "/favicon-16x16.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4148365701967590"
					crossOrigin="anonymous"
				></script>
			</head>
			<body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
				{children}
				<Toaster />
				{/* <Analytics /> */}
			</body>
		</html>
	);
}
