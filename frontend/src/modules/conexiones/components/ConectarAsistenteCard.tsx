import { Bot } from "lucide-react";
import { type ReactNode, useState } from "react";
import { BotonCopiar } from "@/core/components/ui/BotonCopiar";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/core/components/ui/Card";
import { cn } from "@/core/utils/cn";

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

function Pasos({ children }: { children: ReactNode }) {
	return <ol className="list-decimal space-y-2 pl-5">{children}</ol>;
}

const Nota = ({ children }: { children: ReactNode }) => (
	<p className="text-xs text-tinta-tenue">{children}</p>
);

/** Los nombres de los menús van en inglés porque así aparecen en cada app. */
const CLIENTES: { nombre: string; guia: (url: string) => ReactNode }[] = [
	{
		nombre: "Claude",
		guia: () => (
			<>
				<Pasos>
					<li>
						En{" "}
						<a
							href="https://claude.ai"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-indigo-400 hover:underline"
						>
							claude.ai
						</a>{" "}
						ve a <strong>Customize → Connectors</strong> y pulsa{" "}
						<strong>+ Add → Add custom connector</strong>.
					</li>
					<li>
						Nombre <strong>Cosmoflow</strong>, pega la dirección, pulsa{" "}
						<strong>Continue</strong>, elige <strong>Sign in now</strong> y
						pulsa <strong>Add</strong>.
					</li>
					<li>
						Aprueba en Cosmoflow y actívalo en cada conversación con{" "}
						<strong>+ → Connectors → Cosmoflow</strong>.
					</li>
				</Pasos>
				<Nota>
					Sirve también para Claude Desktop y la app del móvil. En planes Team o
					Enterprise lo añade un propietario y cada miembro pulsa{" "}
					<strong>Connect</strong> con su cuenta.
				</Nota>
			</>
		),
	},
	{
		nombre: "Claude Code",
		guia: (url) => (
			<>
				<p>Ejecuta esto en la terminal y luego escribe /mcp para entrar:</p>
				<Campo valor={`claude mcp add --transport http cosmoflow ${url}`} />
			</>
		),
	},
	{
		nombre: "ChatGPT",
		guia: () => (
			<>
				<Pasos>
					<li>
						En <strong>Settings → Apps &amp; Connectors → Advanced</strong>{" "}
						activa el <strong>Developer mode</strong>.
					</li>
					<li>
						En <strong>Apps &amp; Connectors</strong> pulsa{" "}
						<strong>Create</strong>, pega la dirección y elige{" "}
						<strong>OAuth</strong>.
					</li>
					<li>Aprueba en Cosmoflow.</li>
				</Pasos>
				<Nota>
					En algunos planes ChatGPT solo permite herramientas de lectura.
				</Nota>
			</>
		),
	},
	{
		nombre: "OpenCode",
		guia: (url) => (
			<>
				<p>
					Añade esto a tu <code>opencode.json</code>. Se te pedirá entrar la
					primera vez que lo uses; si no, ejecuta{" "}
					<code>opencode mcp auth cosmoflow</code>.
				</p>
				<Campo
					valor={JSON.stringify(
						{ mcp: { cosmoflow: { type: "remote", url } } },
						null,
						2,
					)}
				/>
			</>
		),
	},
	{
		nombre: "Antigravity",
		guia: (url) => (
			<>
				<p>
					Añade esto a <code>~/.gemini/config/mcp_config.json</code> (o a{" "}
					<code>.agents/mcp_config.json</code> en un proyecto). El campo es{" "}
					<code>serverUrl</code>, no <code>url</code>.
				</p>
				<Campo
					valor={JSON.stringify(
						{ mcpServers: { cosmoflow: { serverUrl: url } } },
						null,
						2,
					)}
				/>
			</>
		),
	},
];

/** Conector MCP: una dirección para todos los asistentes y la guía del que elijas. */
export function ConectarAsistenteCard() {
	const url = `${window.location.origin}/mcp`;
	const [elegido, setElegido] = useState(0);
	const cliente = CLIENTES[elegido];

	return (
		<Card className="space-y-5">
			<CardHeader className="pb-0">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Bot className="size-5" aria-hidden />
					Asistentes de IA
				</CardTitle>
				<CardDescription>
					Pídele a tu asistente que cree tareas, repase tus pendientes o escriba
					notas por ti. Cosmoflow usa MCP, el estándar abierto para conectar
					asistentes con aplicaciones, así que no hay que instalar nada.
				</CardDescription>
			</CardHeader>

			<ol className="grid gap-3 text-sm sm:grid-cols-3">
				{[
					["Añade la dirección", "en tu asistente, siguiendo su guía."],
					[
						"Aprueba el acceso",
						"en Cosmoflow. Tu contraseña nunca sale de aquí.",
					],
					[
						"Contrólalo abajo",
						"en «Tokens personales»: limita permisos o revócalo.",
					],
				].map(([titulo, texto], i) => (
					<li key={titulo} className="rounded-lg border border-borde p-3">
						<p className="font-medium text-tinta">
							<span className="mr-1.5 text-indigo-400">{i + 1}.</span>
							{titulo}
						</p>
						<p className="mt-1 text-tinta-tenue">{texto}</p>
					</li>
				))}
			</ol>

			<div className="space-y-1.5">
				<p className="text-sm font-medium text-tinta-suave">
					Dirección del servidor
				</p>
				<Campo valor={url} />
			</div>

			<div className="space-y-3">
				<fieldset>
					<legend className="mb-1.5 text-sm font-medium text-tinta-suave">
						¿Qué asistente usas?
					</legend>
					<div className="flex flex-wrap gap-1.5">
						{CLIENTES.map(({ nombre }, i) => (
							<button
								key={nombre}
								type="button"
								aria-pressed={i === elegido}
								onClick={() => setElegido(i)}
								className={cn(
									"h-8 cursor-pointer rounded-md border px-3 text-sm transition-colors",
									i === elegido
										? "border-indigo-500 bg-elevada text-tinta"
										: "border-borde text-tinta-tenue hover:text-tinta",
								)}
							>
								{nombre}
							</button>
						))}
					</div>
				</fieldset>
				<div className="space-y-2 text-sm text-tinta-suave">
					{cliente.guia(url)}
				</div>
			</div>
		</Card>
	);
}
