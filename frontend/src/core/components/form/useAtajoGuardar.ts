import { useEffect, useEffectEvent } from "react";

/** Ctrl+S (⌘S en Mac) llama a `guardar` en vez de abrir «Guardar página» del navegador. */
export function useAtajoGuardar(guardar: () => void) {
	const alPulsar = useEffectEvent((e: KeyboardEvent) => {
		if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
		e.preventDefault();
		guardar();
	});
	useEffect(() => {
		// En captura: el editor markdown no llega a tragarse la tecla.
		window.addEventListener("keydown", alPulsar, true);
		return () => window.removeEventListener("keydown", alPulsar, true);
	}, []);
}
