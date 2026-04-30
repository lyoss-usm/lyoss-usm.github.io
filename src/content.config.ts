// src/content.config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const proyectosCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
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
			githubUrl: z.url().optional(),
			siteUrl: z.url().optional(),
			issuesUrl: z.url().optional(),
			findBy: z.array(z.string()).optional()
		})
});

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
	proyectos: proyectosCollection,
	canales: canalesCollection,
	contenidos: contenidosCollection,
	nosotros: nosotrosCollection
};
