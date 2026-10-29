import { type ReactNode, useRef, useState } from "react";
import { cn } from "@/core/utils/cn";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const CLAVE_COLAPSADO = "sidebar-colapsado";

function leerColapsado() {
	try {
		return localStorage.getItem(CLAVE_COLAPSADO) === "1";
	} catch {
		return false; // localStorage bloqueado (modo privado)
	}
}

export function MainLayout({ children }: { children: ReactNode }) {
	const [colapsado, setColapsado] = useState(leerColapsado);
	const cajon = useRef<HTMLDialogElement>(null);

	const alternar = () => {
		setColapsado(!colapsado);
		try {
			localStorage.setItem(CLAVE_COLAPSADO, colapsado ? "0" : "1");
		} catch {
			// sin persistencia: dura hasta recargar
		}
	};
	const cerrarCajon = () => cajon.current?.close();

	return (
		<div className="flex min-h-screen bg-fondo text-tinta">
			<aside
				className={cn(
					"sticky top-0 hidden h-screen shrink-0 bg-lateral transition-[width] duration-200 ease-out motion-reduce:transition-none md:block",
					colapsado ? "w-14" : "w-60",
				)}
			>
				<Sidebar colapsado={colapsado} onAlternar={alternar} />
			</aside>

			{/* Móvil: el mismo menú en un cajón (<dialog>: foco atrapado, Esc y fondo inerte). */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: el equivalente de teclado es Esc, nativo de <dialog> */}
			<dialog
				ref={cajon}
				aria-label="Menú"
				onClick={(e) => e.target === cajon.current && cerrarCajon()}
				className={cn(
					"fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 max-w-[85vw] bg-lateral p-0 text-lateral-tinta backdrop:bg-zinc-950/50",
					"-translate-x-full transition-[translate,display,overlay] transition-discrete duration-200 ease-out open:translate-x-0 starting:open:-translate-x-full motion-reduce:transition-none md:hidden",
				)}
			>
				<Sidebar onNavegar={cerrarCajon} />
			</dialog>

			<div className="flex min-w-0 flex-1 flex-col">
				<Navbar onAbrirMenu={() => cajon.current?.showModal()} />
				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					{children}
				</main>
			</div>
		</div>
	);
}
