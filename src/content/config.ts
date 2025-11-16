import { defineCollection, z } from "astro:content";

const projectsCollection = defineCollection({
	type: "content",
	schema: ({ image }) => z.object({
		title: z.string().min(1),
		description: z.string().min(1),
		repo: z.string().url().optional(),
		link: z.string().url().optional(),
		preview: image().optional(),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = {
	"projects": projectsCollection,
};
