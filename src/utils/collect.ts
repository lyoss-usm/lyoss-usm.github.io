import reposJSON from '@data/repos.json';
import constribucionesJSON from '@data/contributions.json';
import contribuidoresJSON from '@data/contributors.json';

/* Interfaces RAW DATA */

interface Repositorio {
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	url: string;
	homepage: string;
	openGraphImageUrl: string;
	stargazerCount: number;
	forkCount: number;
	issues: number;
	pullRequests: number;
	latestRelease?: {
		tagName: string;
		publishedAt: string;
		url: string;
	};
	license: string;
	repositoryTopics: Array<string>;
	languages: Array<{
		size: number;
		node: {
			name: string;
		};
	}>;
	custom_properties: {
		display: string;
		active: string;
		help: string;
	};
}

interface Contribuidor {
	login: string;
	html_url: string; // <-- Aun no se usa
	avatar_url: string;
	contributions: number; // <-- Aun no se usa
}

type repo = string;
type usuario = string;
interface Contribuciones {
	repos: Record<repo, Record<usuario, number>>;
	total: Record<usuario, number>; // <-- Aun no se usa
}

/* Tipos processed DATA */
export type Proyecto = {
	createdAt: string;
	updatedAt: string;
	name: string;
	description: string;
	url: string;
	homepage: string;
	bannerUrl: string;
	stars: number;
	issues: number;
	forks: number;
	prs: number; // <-- Aun no se usa
	people: {
		name: string;
		avatar_url: string;
	}[];
	size: number; // <-- Aun no se usa
	languages: {
		weight: number; // <-- Aun no se usa
		name: string;
	}[];
	latest: {
		url: string; // <-- Aun no se usa
		publishedAt: string; // <-- Aun no se usa
		tag: string;
	} | null;
	licence: string | null; // <-- Aun no se usa
	topics: string[];
	techs: string[];
	isActive: boolean;
	needHelp: boolean;
};

/* Funciones de recoleccion */

export function getProyectos(): [Proyecto[], string[]] {
	const repositorios = reposJSON as Repositorio[];
	const contribuciones = constribucionesJSON as Contribuciones;
	const contribuidores = contribuidoresJSON as Contribuidor[];
	const fullPeople = new Map(contribuidores.map((c) => [c.login, c]));
	let techs = new Set<string>();
	const proyectosProcesados = repositorios.map((repo) => {
		const contribuidoresRepo = contribuciones.repos[repo.name] ?? {};
		const peopleContribuidores = (Object.keys(contribuidoresRepo) || [])
			.map((nombre) => {
				const p = fullPeople.get(nombre);
				if (!p) return null;
				return {
					name: p.login,
					avatar_url: p.avatar_url
				};
			})
			.filter((p) => !!p);
		let totalSize = 0;
		let langs = [] as { weight: number; name: string }[];
		repo.languages?.forEach((lang) => {
			totalSize += lang.size;
		});
		if (totalSize != 0) {
			repo.languages?.forEach((lang) => {
				langs.push({
					weight: lang.size / totalSize,
					name: lang.node.name
				});
			});
		}
		let latest = null;
		if (repo.latestRelease) {
			const { tagName, url, publishedAt } = repo.latestRelease;
			latest = {
				url,
				publishedAt,
				tag: tagName
			};
		}
		const repoTechs = new Set([
			...repo.repositoryTopics,
			...langs.map((l) => l.name.toLowerCase())
		]);
		techs = techs.union(repoTechs);
		const { display, active, help } = repo.custom_properties;
		const nombre = display == 'Proyecto LyOSS' ? repo.name : display;
		return {
			createdAt: repo.createdAt,
			updatedAt: repo.updatedAt,
			name: nombre,
			description: repo.description ?? '',
			url: repo.url,
			homepage: repo.homepage,
			bannerUrl: repo.openGraphImageUrl,
			stars: repo.stargazerCount,
			issues: repo.issues,
			forks: repo.forkCount,
			prs: repo.pullRequests,
			people: peopleContribuidores,
			size: totalSize,
			languages: langs,
			latest: latest,
			licence: repo.license,
			topics: repo.repositoryTopics,
			techs: Array.from(repoTechs),
			isActive: active === 'true',
			needHelp: help === 'true'
		};
	});
	return [proyectosProcesados, Array.from(techs)];
}
