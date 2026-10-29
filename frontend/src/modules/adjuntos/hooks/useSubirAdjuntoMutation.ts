import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/core/api/client";
import { adjuntosApi } from "../api/adjuntosApi";

export function useSubirAdjuntoMutation() {
	return useMutation({
		mutationFn: adjuntosApi.subir,
		onError: (error) => toast.error(getErrorMessage(error)),
	});
}
