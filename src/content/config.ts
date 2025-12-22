import { defineCollection, z } from "astro:content";

// Esto es de ejemplo, CAMBIAR!!
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

const canalesCollection = defineCollection({
    type: 'data',
    schema: ({ image }) =>
    z.array(
        z.object({
          nombre: z.string(),
          url: z.string().url(),
          descripcion: z.string(),
          logo: image(),
          logoDark: image().optional(),
        })
    ),
});

const contenidosCollection = defineCollection({
    type: 'content',
});

export const collections = {
	"projects": projectsCollection,
	"canales": canalesCollection,
	"contenidos": contenidosCollection,
};
