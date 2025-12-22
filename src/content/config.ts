import { defineCollection, z } from 'astro:content';

const proyectosCollection = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z.object({
			stars: z.number().optional(),
			contributors: z.number().optional(),
			forks: z.number().optional(),
			issues: z.number().optional(),
			active: z.boolean(),
			helpWanted: z.boolean().optional(),
			bannerUrl: image().optional(),
			logoUrl: image().optional(),
			githubUrl: z.string().url().optional(),
			siteUrl: z.string().url().optional(),
			issuesUrl: z.string().url().optional(),
			findBy: z.array(z.string()).optional()
		})
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
				logoDark: image().optional()
			})
		)
});

const contenidosCollection = defineCollection({
	type: 'content'
});

export const collections = {
	proyectos: proyectosCollection,
	canales: canalesCollection,
	contenidos: contenidosCollection
};
