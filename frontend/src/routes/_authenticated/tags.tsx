import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TagsPage } from "@/modules/tags/pages/TagsPage";

export const Route = createFileRoute("/_authenticated/tags")({
	// `?nuevo=true`: abre el alta al entrar (paleta Ctrl+K).
	validateSearch: z.object({ nuevo: z.boolean().optional() }),
	component: function Tags() {
		return <TagsPage nuevo={Route.useSearch().nuevo} />;
	},
});
