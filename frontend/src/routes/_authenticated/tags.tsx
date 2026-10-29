import { createFileRoute } from "@tanstack/react-router";
import { TagsPage } from "@/modules/tags/pages/TagsPage";

export const Route = createFileRoute("/_authenticated/tags")({
	component: TagsPage,
});
