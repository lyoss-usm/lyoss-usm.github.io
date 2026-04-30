import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const canalesCollection = defineCollection({
	loader: file('./src/content/canales/redes.json'),
	schema: ({ image }) =>
		z.object({
			nombre: z.string(),
			url: z.url(),
			descripcion: z.string(),
			logo: image(),
			logoDark: image().optional()
		})
});

const contenidosCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/contenidos' })
});

const nosotrosCollection = defineCollection({
	loader: file('./src/content/nosotros/miembros.json'),
	schema: ({ image }) =>
		z.object({
			nombre: z.string(),
			rol: z.string(),
			esPresidencia: z.boolean().optional(),
			estado: z.enum(['organigrama', 'activo', 'inactivo']).optional(),
			bio: z.string().optional(),
			avatar: image().optional(),
			avatarURL: z.url().optional(),
			githubUrl: z.url().optional(),
			webUrl: z.url().optional(),
			linkedinUrl: z.url().optional(),
			instagramUrl: z.url().optional(),
			codebergUrl: z.url().optional(),

			area: z.enum(['administrativa', 'tecnologica']).optional(),
			esJefaturaArea: z.boolean().optional(),
			cargoJefatura: z.string().optional(),
			equipo: z.string().optional(),
			cargoEquipo: z.string().optional(),
			descripcionEquipo: z.string().optional(),
			ordenEquipo: z.number().optional()
		})
});

export const collections = {
	canales: canalesCollection,
	contenidos: contenidosCollection,
	nosotros: nosotrosCollection
};
