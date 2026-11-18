export interface OpcionesPlantillaCorreo {
	/** Etiqueta corta en el encabezado (ej. "Cuenta", "Invitación", "Aviso"). */
	categoria: string;
	/** Título principal dentro de la tarjeta. */
	titulo: string;
	/** Saludo inicial, ej. "Hola, Ana:". */
	saludo: string;
	/** Párrafos del mensaje (texto plano, se escapa automáticamente). */
	parrafos: string[];
	/** Botón de acción principal. */
	accion?: {
		texto: string;
		url: string;
	};
	/** Nota secundaria al pie del cuerpo (ej. vigencia o instrucción de seguridad). */
	nota?: string;
	/** Pie del correo fuera o al final de la tarjeta. */
	pie?: string;
	/** URL base de la app para enlazar al pie si aplica. */
	appUrl?: string;
}

const MAPA_ESCAPE_HTML: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/** Escapa caracteres especiales HTML para evitar inyección desde títulos o nombres. */
export function escaparHtml(texto: string): string {
	return texto.replace(/[&<>"']/g, (char) => MAPA_ESCAPE_HTML[char] ?? char);
}

/** Valida que la URL use http(s) antes de incrustarla en un atributo href. */
function sanitizarUrl(url: string): string {
	const limpia = url.trim();
	if (/^https?:\/\//i.test(limpia)) {
		return escaparHtml(limpia);
	}
	return "#";
}

/**
 * Construye un correo HTML responsivo con CSS inline compatible con clientes de correo
 * (Gmail, Outlook, Apple Mail, Thunderbird) usando la paleta índigo de Cosmoflow.
 */
export function construirCorreoHtml(opciones: OpcionesPlantillaCorreo): string {
	const categoria = escaparHtml(opciones.categoria);
	const titulo = escaparHtml(opciones.titulo);
	const saludo = escaparHtml(opciones.saludo);

	const parrafosHtml = opciones.parrafos
		.map(
			(p) =>
				`<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">${escaparHtml(p)}</p>`,
		)
		.join("\n\t\t\t\t\t\t");

	let accionHtml = "";
	if (opciones.accion) {
		const textoBoton = escaparHtml(opciones.accion.texto);
		const urlSegura = sanitizarUrl(opciones.accion.url);
		accionHtml = `
						<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 20px;">
							<tr>
								<td align="center" bgcolor="#4f46e5" style="border-radius:8px;background-color:#4f46e5;">
									<a href="${urlSegura}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${textoBoton}</a>
								</td>
							</tr>
						</table>
						<p style="margin:0 0 14px;font-size:12px;line-height:1.5;color:#64748b;word-break:break-all;">
							Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
							<a href="${urlSegura}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:underline;">${urlSegura}</a>
						</p>`;
	}

	const notaHtml = opciones.nota
		? `<p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.5;color:#64748b;">${escaparHtml(opciones.nota)}</p>`
		: "";

	const pieTexto = opciones.pie ?? "Enviado automáticamente por Cosmoflow.";
	const enlaceAppHtml = opciones.appUrl
		? ` · <a href="${sanitizarUrl(opciones.appUrl)}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:none;">Abrir Cosmoflow</a>`
		: "";

	return `<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1.0" />
	<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5fa;padding:32px 16px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e4f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(30,27,75,0.06);">
					<tr>
						<td style="background-color:#1e1b4b;padding:20px 28px;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
								<tr>
									<td style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">Cosmoflow</td>
									<td align="right">
										<span style="display:inline-block;padding:4px 10px;border-radius:999px;background-color:#312e81;color:#c7d2fe;font-size:11px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;">${categoria}</span>
									</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding:28px;">
							<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;font-weight:700;color:#0f172a;">${titulo}</h1>
							<p style="margin:0 0 12px;font-size:15px;line-height:1.6;font-weight:600;color:#1e293b;">${saludo}</p>
							${parrafosHtml}${accionHtml}${notaHtml}
						</td>
					</tr>
					<tr>
						<td style="background-color:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.5;color:#64748b;text-align:center;">
							${escaparHtml(pieTexto)}${enlaceAppHtml}
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;
}
