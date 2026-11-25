import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { AuthLayout } from "@/core/components/layout/AuthLayout";
import { Spinner } from "@/core/components/ui/Spinner";
import { cn } from "@/core/utils/cn";
import {
	clasificarAssets,
	detectarSistema,
	type Release,
	type Sistema,
	ULTIMO_RELEASE,
} from "../utils/plataformas";

const NOMBRES: Record<Sistema, string> = {
	windows: "Windows",
	macos: "macOS",
	linux: "Linux",
	android: "Android",
};

/** Mientras las apps no estén firmadas, el sistema avisa al abrirlas la primera vez. */
const AVISOS: Partial<Record<Sistema, string>> = {
	windows:
		"Si aparece «Windows protegió tu PC», pulsa «Más información» → «Ejecutar de todas formas».",
	macos:
		"Si macOS no la deja abrir, ve a Ajustes → Privacidad y seguridad → «Abrir igualmente».",
	linux: "Necesita drivers de Vulkan (Mesa en la mayoría de distribuciones).",
	android: "Permite instalar apps de origen desconocido para tu navegador.",
};

const enlace =
	"inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors";

function megas(bytes: number) {
	return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

async function obtenerUltimoRelease(): Promise<Release> {
	const respuesta = await fetch(ULTIMO_RELEASE, {
		headers: { Accept: "application/vnd.github+json" },
	});
	if (!respuesta.ok) throw new Error(`GitHub respondió ${respuesta.status}`);
	return respuesta.json();
}

export function DescargasPage() {
	const { data, isPending, isError } = useQuery({
		queryKey: ["descargas", "ultimo-release"],
		queryFn: obtenerUltimoRelease,
		staleTime: 10 * 60 * 1000,
	});
	const propio = detectarSistema(navigator.userAgent);
	const descargas = data ? clasificarAssets(data.assets) : [];
	const principal = descargas.find((d) => d.sistema === propio);

	return (
		<AuthLayout
			title="Descarga Cosmoflow"
			subtitle="App nativa para escritorio y Android, con la misma cuenta que la web."
		>
			{isPending && (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			)}
			{isError && (
				<p className="text-sm text-tinta-suave">
					No se pudo consultar la última versión.{" "}
					<a
						href="https://github.com/VicRa2004/cosmoflow/releases/latest"
						className="font-medium text-indigo-400 hover:underline"
					>
						Ver las descargas en GitHub
					</a>
				</p>
			)}
			{data && (
				<div className="space-y-6">
					{principal && propio && (
						<div className="space-y-2">
							<a
								href={principal.url}
								className={cn(
									enlace,
									"h-10 w-full bg-indigo-600 px-4 text-sm text-white hover:bg-indigo-700",
								)}
							>
								<Download aria-hidden className="size-4" />
								Descargar para {NOMBRES[propio]}
							</a>
							<p className="text-xs text-tinta-tenue">
								{principal.etiqueta} · {megas(principal.tamano)} · versión{" "}
								{data.tag_name.replace(/^v/, "")}
							</p>
							{AVISOS[propio] && (
								<p className="text-xs text-tinta-tenue">{AVISOS[propio]}</p>
							)}
						</div>
					)}

					<div className="space-y-3">
						<h2 className="text-sm font-medium text-tinta">
							{principal ? "Otros sistemas" : "Elige tu sistema"}
						</h2>
						<ul className="divide-y divide-borde rounded-md border border-borde">
							{descargas
								.filter((d) => d !== principal)
								.map((d) => (
									<li key={d.url}>
										<a
											href={d.url}
											className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-tinta hover:bg-elevada"
										>
											<span>
												{NOMBRES[d.sistema]}{" "}
												<span className="text-tinta-tenue">· {d.etiqueta}</span>
											</span>
											<span className="text-xs tabular-nums text-tinta-tenue">
												{megas(d.tamano)}
											</span>
										</a>
									</li>
								))}
						</ul>
					</div>
				</div>
			)}
			<div className="mt-8 text-center text-sm text-tinta-tenue">
				<Link
					to="/login"
					className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
				>
					Volver a Cosmoflow
				</Link>
			</div>
		</AuthLayout>
	);
}
