import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { type AmbitoAdjunto, adjuntosApi } from "../api/adjuntosApi";

/** Con `ambito`, la imagen la ven también los miembros de ese equipo o proyecto. */
export function useSubirAdjuntoMutation(ambito?: AmbitoAdjunto) {
	return useMutation({
		mutationFn: (archivo: File) => adjuntosApi.subir(archivo, ambito),
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
