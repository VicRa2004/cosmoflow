import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./Button";

export function BotonCopiar({ texto }: { texto: string }) {
	const [copiado, setCopiado] = useState(false);

	const copiar = async () => {
		try {
			await navigator.clipboard.writeText(texto);
			setCopiado(true);
		} catch {
			toast.error("No se pudo copiar: selecciónalo y cópialo a mano.");
		}
	};

	return (
		<Button variant="outline" size="sm" className="shrink-0" onClick={copiar}>
			{copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
			{copiado ? "Copiado" : "Copiar"}
		</Button>
	);
}
