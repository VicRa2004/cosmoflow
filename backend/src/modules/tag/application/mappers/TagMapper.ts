import type { Tag } from "../../domain/Tag";
import type { TagDto } from "../dtos/TagDto";

export const TagMapper = {
	toDto(tag: Tag): TagDto {
		return {
			id: tag.getId(),
			nombre: tag.getNombre(),
		};
	},
};
