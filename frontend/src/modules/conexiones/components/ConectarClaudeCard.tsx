import type { ReactNode } from "react";
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
			<code className="min-w-0 flex-1 whitespace-pre-wrap break-all rounded-md bg-elevada p-2 font-mono text-xs select-all">
				{valor}
			</code>
			<BotonCopiar texto={valor} />
		</div>
	);
}

function OtroCliente({
	titulo,
	children,
}: {
	titulo: string;
	children: ReactNode;
}) {
	return (
		<details className="text-sm text-tinta-suave">
			<summary className="cursor-pointer font-medium">{titulo}</summary>
			<div className="mt-2 space-y-2">{children}</div>
		</details>
	);
}

/** Los nombres de los menús van en inglés porque así aparecen en claude.ai. */
export function ConectarClaudeCard() {
	const url = `${window.location.origin}/mcp`;

	return (
		<Card className="space-y-4">
			<CardHeader className="pb-0">
				<CardTitle className="text-lg">
					Conectar con Claude y otros asistentes
				</CardTitle>
				<CardDescription>
					Gestiona tareas, notas, notificaciones y proyectos desde una
					conversación. No hay que instalar nada.
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
				en «Tokens personales»: ahí puedes limitar sus permisos (p. ej. solo
				leer) o revocarla cuando quieras.
			</p>

			<OtroCliente titulo="¿Usas Claude Code?">
				<p>Ejecuta esto en tu terminal y escribe /mcp para iniciar sesión:</p>
				<Campo valor={`claude mcp add --transport http cosmoflow ${url}`} />
			</OtroCliente>

			<OtroCliente titulo="¿Usas ChatGPT?">
				<ol className="list-decimal space-y-1 pl-5">
					<li>
						En <strong>Settings → Apps &amp; Connectors → Advanced</strong>,
						activa el <strong>Developer mode</strong>.
					</li>
					<li>
						En <strong>Apps &amp; Connectors</strong> pulsa{" "}
						<strong>Create</strong>, pega la dirección de arriba y elige{" "}
						<strong>OAuth</strong> como autenticación.
					</li>
					<li>
						Se abrirá Cosmoflow: comprueba que el destino es{" "}
						<strong>chatgpt.com</strong> y pulsa <strong>Permitir</strong>.
					</li>
				</ol>
				<p className="text-xs text-tinta-tenue">
					En algunos planes ChatGPT solo permite herramientas de lectura.
				</p>
			</OtroCliente>

			<OtroCliente titulo="¿Usas OpenCode?">
				<p>
					Añade esto a tu <code>opencode.json</code>; al usarlo se abrirá el
					inicio de sesión. Si no se abre, ejecuta{" "}
					<code>opencode mcp auth cosmoflow</code>.
				</p>
				<Campo
					valor={JSON.stringify(
						{ mcp: { cosmoflow: { type: "remote", url } } },
						null,
						2,
					)}
				/>
			</OtroCliente>

			<OtroCliente titulo="¿Usas Antigravity?">
				<p>
					Añade esto a <code>~/.gemini/config/mcp_config.json</code> (o a{" "}
					<code>.agents/mcp_config.json</code> en un proyecto). Ojo: el campo es{" "}
					<code>serverUrl</code>, no <code>url</code>.
				</p>
				<Campo
					valor={JSON.stringify(
						{ mcpServers: { cosmoflow: { serverUrl: url } } },
						null,
						2,
					)}
				/>
			</OtroCliente>
		</Card>
	);
}
