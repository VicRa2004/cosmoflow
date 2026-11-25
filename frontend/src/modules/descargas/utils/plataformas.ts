/** Último Release público de GitHub: lo publican los workflows `desktop.yml` y `mobile.yml` en cada tag. */
export const ULTIMO_RELEASE =
	"https://api.github.com/repos/VicRa2004/cosmoflow/releases/latest";

export type Sistema = "windows" | "macos" | "linux" | "android";

export interface Asset {
	name: string;
	browser_download_url: string;
	size: number;
}

export interface Release {
	tag_name: string;
	html_url: string;
	published_at: string;
	assets: Asset[];
}

export interface Descarga {
	sistema: Sistema;
	etiqueta: string;
	url: string;
	tamano: number;
}

/** Nombres que genera `desktop/scripts/empaquetar.sh` (y el APK de mobile.yml), en orden de preferencia. */
const PATRONES: { sistema: Sistema; etiqueta: string; patron: RegExp }[] = [
	{
		sistema: "windows",
		etiqueta: "Instalador (.exe)",
		patron: /-windows-.*-setup\.exe$/,
	},
	{
		sistema: "windows",
		etiqueta: "Portable (.zip)",
		patron: /-windows-.*\.zip$/,
	},
	{
		sistema: "macos",
		etiqueta: "Apple Silicon (.dmg)",
		patron: /-macos-arm64\.dmg$/,
	},
	{ sistema: "linux", etiqueta: "Debian / Ubuntu (.deb)", patron: /\.deb$/ },
	{
		sistema: "linux",
		etiqueta: "Portable (.tar.gz)",
		patron: /-linux-.*\.tar\.gz$/,
	},
	{ sistema: "android", etiqueta: "Android (.apk)", patron: /\.apk$/ },
];

export function clasificarAssets(assets: Asset[]): Descarga[] {
	return PATRONES.flatMap(({ sistema, etiqueta, patron }) => {
		const asset = assets.find((a) => patron.test(a.name));
		return asset
			? [
					{
						sistema,
						etiqueta,
						url: asset.browser_download_url,
						tamano: asset.size,
					},
				]
			: [];
	});
}

export function detectarSistema(userAgent: string): Sistema | null {
	const ua = userAgent.toLowerCase();
	if (ua.includes("android")) return "android";
	if (ua.includes("windows")) return "windows";
	if (ua.includes("mac os") || ua.includes("macintosh")) return "macos";
	if (ua.includes("linux") || ua.includes("x11")) return "linux";
	return null;
}
