import { type ComponentPropsWithoutRef, useEffect, useState } from "react";
import { adjuntosApi } from "../api/adjuntosApi";

/**
 * `<img>` de un adjunto privado: el navegador no manda el Bearer en un `<img src>`,
 * así que se descarga con `apiClient` y se muestra como blob.
 */
export function ImagenAdjunto({
	src,
	alt,
	...props
}: ComponentPropsWithoutRef<"img"> & { src: string }) {
	const [url, setUrl] = useState<string>();
	const [error, setError] = useState(false);

	useEffect(() => {
		let blobUrl: string | undefined;
		let cancelado = false;
		setError(false);
		adjuntosApi
			.descargar(src)
			.then((data) => {
				if (cancelado) return;
				blobUrl = URL.createObjectURL(data);
				setUrl(blobUrl);
			})
			.catch(() => !cancelado && setError(true));
		return () => {
			cancelado = true;
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [src]);

	if (error) {
		return (
			<span className="text-xs text-tinta-tenue">
				[Imagen no disponible{alt ? `: ${alt}` : ""}]
			</span>
		);
	}
	if (!url) {
		return (
			<span className="block h-32 w-48 animate-pulse rounded-lg bg-elevada" />
		);
	}
	return <img src={url} alt={alt} {...props} />;
}
