import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';
import { interpretarFecha } from './utils/eventos';

// Las fechas se escriben en hora de Chile: 2026-11-13 o '2026-11-13 18:00'.
// Entrecomilla el valor cuando incluyas hora o zona horaria, para que js-yaml no
// lo convierta a un Date ambiguo. Ver interpretarFecha en utils/eventos.ts

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

const fecha = z
	.union([z.string(), z.date()])
	.transform((valor) => interpretarFecha(valor))
	.refine((valor) => valor instanceof Date, {
		message: 'Si la fecha incluye hora o zona horaria, entrecomilla el valor: 2026-11-13 18:00'
	})
	.refine((valor) => !(valor instanceof Date) || !Number.isNaN(valor.getTime()), {
		message: 'Fecha no válida. Usa 2026-11-13 o, entrecomillado, 2026-11-13 18:00'
	});

/*
 * Un evento puede llevar varios llamados a la accion (inscribirse, ver las bases,
 * repositorio). Cada uno con su texto, su destino y su color, asi que la lista
 * se recorre en el orden en que se escribio.
 */
const enlaceEvento = z.object({
	texto: z.string(),
	url: z.url(),
	color: z.enum(['primary', 'secondary', 'accent', 'neutral']).default('primary')
});

const eventosCollection = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/eventos' }),
	schema: z.object({
		titulo: z.string(),
		tipo: z.enum(['institucional', 'taller', 'hackaton', 'coloquio', 'charla', 'otro']),
		serie: z.string().optional(),
		fechaInicio: fecha,
		fechaFin: fecha.optional(),
		ubicacion: z.string(),
		descripcion: z.string().max(300),
		enlaces: z.array(enlaceEvento).default([]),
		destacado: z.boolean().default(false)
	})
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
	eventos: eventosCollection,
	nosotros: nosotrosCollection
};
