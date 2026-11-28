import { expect, test } from "@playwright/test";

test.describe("Flujo principal en navegador", () => {
	test("login → crear tarea → completarla → crear nota", async ({ page }) => {
		const marca = Date.now();
		const tituloTarea = `Tarea E2E ${marca}`;
		const tituloNota = `Nota E2E ${marca}`;

		// 1. Login con el usuario estándar del seed demo.
		await page.goto("/login");
		await page.getByLabel("Correo electrónico").fill("usuario@dev.com");
		await page.getByLabel("Contraseña").fill("SecurePass123!");
		await page.getByRole("button", { name: "Iniciar sesión" }).click();

		await expect(page).not.toHaveURL(/\/login$/);
		await expect(page).toHaveURL(/\/dashboard/);

		// 2. Crear tarea desde /tareas/nueva (lleva a /tareas y se abre en lectura).
		await page.goto("/tareas/nueva");
		await page.getByLabel("Título").fill(tituloTarea);
		await page.getByRole("button", { name: /^Crear/ }).click();

		await expect(page).toHaveURL(/\/tareas(?:\?|$)/);
		const enlaceTarea = page.getByRole("button", {
			name: tituloTarea,
			exact: true,
		});
		await expect(enlaceTarea).toBeVisible();
		await enlaceTarea.click();

		await expect(page).toHaveURL(/\/tareas\/\d+$/);

		// 3. Completar la tarea y verificar que persiste al recargar.
		await page
			.getByRole("button", { name: `Completar «${tituloTarea}»` })
			.click();
		const botonReabrir = page.getByRole("button", {
			name: `Reabrir «${tituloTarea}»`,
		});
		await expect(botonReabrir).toBeVisible();

		await page.reload();
		await expect(
			page.getByRole("button", { name: `Reabrir «${tituloTarea}»` }),
		).toBeVisible();

		// 4. Crear nota desde /notas/nueva y verificar que persiste tras recargar (se abre en el editor).
		await page.goto("/notas/nueva");
		await page.getByLabel("Título").fill(tituloNota);
		await page.getByRole("button", { name: /^Crear/ }).click();

		await expect(page).toHaveURL(/\/notas\/\d+/);
		// La nota se abre en el editor: el título está en su campo, no en un encabezado.
		await expect(page.getByLabel("Título")).toHaveValue(tituloNota);

		await page.reload();
		await expect(page.getByLabel("Título")).toHaveValue(tituloNota);
	});
});
