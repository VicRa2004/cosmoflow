import { ExternalLink, Send } from "lucide-react";
import { Button } from "@/core/components/ui/Button";
import {
	useDesvincularTelegramMutation,
	useVincularTelegramMutation,
} from "../hooks/useTelegram";

/**
 * Vincular abre el bot con un enlace de un solo uso (15 min). Se muestra como enlace
 * y no con `window.open`: tras la petición, el navegador bloquearía la ventana.
 */
export function VinculoTelegram({ vinculado }: { vinculado: boolean }) {
	const vincular = useVincularTelegramMutation();
	const desvincular = useDesvincularTelegramMutation();

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-borde p-4 sm:flex-row sm:items-center sm:justify-between">
			<p className="text-sm text-tinta-suave">
				{vinculado
					? "Tu cuenta de Telegram está vinculada."
					: vincular.data
						? "Abre Telegram y pulsa «Iniciar». Vuelve aquí cuando el bot te confirme."
						: "Vincula Telegram para recibir los avisos también allí."}
			</p>
			{vinculado ? (
				<Button
					variant="dangerGhost"
					size="sm"
					onClick={() => desvincular.mutate()}
					isLoading={desvincular.isPending}
				>
					Desvincular
				</Button>
			) : vincular.data ? (
				<a
					href={vincular.data}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
				>
					<ExternalLink className="h-4 w-4" />
					Abrir Telegram
				</a>
			) : (
				<Button
					variant="outline"
					size="sm"
					onClick={() => vincular.mutate()}
					isLoading={vincular.isPending}
				>
					<Send className="h-4 w-4" />
					Vincular Telegram
				</Button>
			)}
		</div>
	);
}
