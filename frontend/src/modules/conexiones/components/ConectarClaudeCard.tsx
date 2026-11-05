import { BotonCopiar } from "@/core/components/ui/BotonCopiar";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";

function Campo({ valor }: { valor: string }) {
	return (
		<div className="flex items-center gap-2">
			<code className="min-w-0 flex-1 break-all rounded-md bg-elevada p-2 font-mono text-xs select-all">
				{valor}
			</code>
			<BotonCopiar texto={valor} />
		</div>
	);
}

/** Los nombres de los menús van en inglés porque así aparecen en claude.ai. */
export function ConectarClaudeCard() {
	const url = `${window.location.origin}/mcp`;

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">Conectar con Claude</CardTitle>
				<CardDescription>
					Consulta tus pendientes, crea y completa tareas, y busca o crea notas
					desde una conversación. No hay que instalar nada.
				</CardDescription>
			</CardHeader>

			<Campo valor={url} />

			<ol className="list-decimal space-y-2 pl-5 text-sm text-tinta-suave">
				<li>Copia la dirección de arriba.</li>
				<li>
					En{" "}
					<a
						href="https://claude.ai"
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium text-indigo-400 hover:underline"
					>
						claude.ai
					</a>
					, ve a <strong>Customize → Connectors</strong>.
				</li>
				<li>
					Pulsa <strong>+ Add → Add custom connector</strong>, escribe{" "}
					<strong>Cosmoflow</strong> como nombre, pega la dirección y pulsa{" "}
					<strong>Continue</strong>.
				</li>
				<li>
					Deja los ajustes que detecte, elige <strong>Sign in now</strong> y
					pulsa <strong>Add</strong>.
				</li>
				<li>
					Se abrirá Cosmoflow: comprueba que el destino es{" "}
					<strong>claude.ai</strong> y pulsa <strong>Permitir</strong>.
				</li>
				<li>
					En cada conversación, actívalo con{" "}
					<strong>+ → Connectors → Cosmoflow</strong>.
				</li>
			</ol>

			<p className="text-xs text-tinta-tenue">
				En un plan Team o Enterprise, solo los propietarios pueden añadir el
				conector; luego cada miembro pulsa <strong>Connect</strong> en esa misma
				pantalla y entra con su cuenta de Cosmoflow. La conexión aparece abajo,
				en «Tokens personales», y puedes revocarla cuando quieras.
			</p>

			<details className="text-sm text-tinta-suave">
				<summary className="cursor-pointer font-medium">
					¿Usas Claude Code?
				</summary>
				<div className="mt-2 space-y-2">
					<p>Ejecuta esto en tu terminal y escribe /mcp para iniciar sesión:</p>
					<Campo valor={`claude mcp add --transport http cosmoflow ${url}`} />
				</div>
			</details>
		</Card>
	);
}
