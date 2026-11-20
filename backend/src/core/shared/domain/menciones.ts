/** `[@Ana](mencion:12)` → 12: las menciones del markdown (decisión 22), sin repetir. */
export const extraerMenciones = (markdown: string): number[] => [
	...new Set(
		[...markdown.matchAll(/\]\(mencion:(\d+)\)/g)].map((m) => Number(m[1])),
	),
];
