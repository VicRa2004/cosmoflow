import { Circle } from "lucide-react";
import type { ReactNode } from "react";
import { Marca } from "./Marca";
import { SelectorTema } from "./SelectorTema";

interface AuthLayoutProps {
	children: ReactNode;
	title: string;
	subtitle: string;
}

/** Tareas de muestra para el panel de marca: enseñan la portada real (pendientes por vencimiento). */
const MUESTRA = [
	{
		titulo: "Enviar propuesta al cliente",
		tag: "trabajo",
		vence: "Ayer",
		vencida: true,
	},
	{ titulo: "Revisar el módulo de notas", tag: "dev", vence: "Hoy" },
	{ titulo: "Pagar la renta", tag: "casa", vence: "30 oct" },
	{ titulo: "Preparar la presentación", tag: "trabajo", vence: "2 nov" },
];

/** Acceso: panel de marca a la izquierda (desde `lg`) y formulario a la derecha. */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
	return (
		<div className="flex min-h-screen bg-fondo">
			<aside className="relative hidden w-[46%] max-w-2xl flex-col gap-16 overflow-hidden bg-lateral p-12 text-lateral-tinta [color-scheme:dark] lg:flex">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_0%_0%,oklch(40%_0.14_277/0.55),transparent_60%)]"
				/>
				<div className="relative flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
					<Marca />
					Cosmoflow
				</div>

				<div className="relative my-auto space-y-10">
					<div className="max-w-md space-y-3">
						<h2 className="text-3xl font-semibold tracking-tight text-balance">
							Lo que vence antes, primero.
						</h2>
						<p className="text-base text-lateral-suave">
							Tareas y notas en markdown, con tags e imágenes, ordenadas para
							que sepas qué hacer ahora.
						</p>
					</div>

					<div
						aria-hidden
						className="max-w-md rounded-lg border border-lateral-borde bg-lateral-elevada/60 p-1.5 shadow-flotante"
					>
						<p className="px-3 pt-2 pb-2.5 text-xs font-medium text-lateral-tenue">
							Pendientes
						</p>
						<ul className="divide-y divide-lateral-borde rounded-md bg-lateral">
							{MUESTRA.map((tarea) => (
								<li
									key={tarea.titulo}
									className="flex items-center gap-3 px-3 py-2.5 text-sm"
								>
									<Circle className="size-4 shrink-0 text-lateral-tenue" />
									<span className="min-w-0 flex-1 truncate">
										{tarea.titulo}
									</span>
									<span className="rounded-md bg-lateral-elevada px-1.5 py-0.5 text-xs text-lateral-suave">
										{tarea.tag}
									</span>
									<span
										className={
											tarea.vencida
												? "w-12 text-right text-xs font-medium tabular-nums text-lateral-alerta"
												: "w-12 text-right text-xs tabular-nums text-lateral-tenue"
										}
									>
										{tarea.vence}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</aside>

			<main className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
				<div className="absolute top-4 right-4">
					<SelectorTema />
				</div>
				<div className="w-full max-w-sm">
					<Marca className="mb-8 size-9 rounded-lg [&_svg]:size-5 lg:hidden" />
					<div className="mb-8 space-y-1.5">
						<h1 className="text-2xl font-semibold tracking-tight text-balance text-tinta">
							{title}
						</h1>
						<p className="text-sm text-tinta-tenue">{subtitle}</p>
					</div>
					{children}
				</div>
			</main>
		</div>
	);
}
