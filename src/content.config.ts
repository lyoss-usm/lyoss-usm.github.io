// src/content.config.ts
import { defineCollection, z } from 'astro:content';
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
            githubUrl: z.string().url().optional(),
            siteUrl: z.string().url().optional(),
            issuesUrl: z.string().url().optional(),
            findBy: z.array(z.string()).optional()
        })
});

const canalesCollection = defineCollection({
    loader: file('./src/content/canales/redes.json'),
    schema: ({ image }) =>
        z.object({
            nombre: z.string(),
            url: z.string().url(),
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
            avatar: z.union([z.string(), image()]), 
            githubUrl: z.string().url().optional(),
            webUrl: z.string().url().optional(),
            linkedinUrl: z.string().url().optional(),
            instagramUrl: z.string().url().optional(),
            codebergUrl: z.string().url().optional(),
            
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