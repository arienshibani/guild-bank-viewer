"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
	to: number;
	/** Hold at 0 until true, so the count-up can be triggered by the caller. */
	start?: boolean;
	durationMs?: number;
	className?: string;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** Counts from 0 up to `to` once `start` is true. Respects reduced motion. */
export function CountUp({
	to,
	start = true,
	durationMs = 2000,
	className,
}: CountUpProps) {
	const [value, setValue] = useState(0);
	const frame = useRef<number>();

	useEffect(() => {
		if (!start) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setValue(to);
			return;
		}

		const startedAt = performance.now();
		const tick = (now: number) => {
			const progress = Math.min((now - startedAt) / durationMs, 1);
			setValue(Math.round(to * easeOutCubic(progress)));
			if (progress < 1) frame.current = requestAnimationFrame(tick);
		};
		frame.current = requestAnimationFrame(tick);

		return () => {
			if (frame.current) cancelAnimationFrame(frame.current);
		};
	}, [start, to, durationMs]);

	return <span className={className}>{value.toLocaleString("en-US")}</span>;
}
