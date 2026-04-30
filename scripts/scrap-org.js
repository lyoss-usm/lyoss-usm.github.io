import fs from 'node:fs/promises';
import path from 'node:path';
import { Octokit } from 'octokit';

const ORG_NAME = 'lyoss-usm';
const EXCLUDED_REPOS = ['.github', 'template', 'discussions', 'docs', 'workflows'];
const OUT_FOLDER = './data';

const octokit = new Octokit({
	auth: process.env.GH_TOKEN
});

async function run() {
	try {
		console.log(`=== Iniciando Scrapping de ${ORG_NAME} ===`);
		await fs.mkdir(OUT_FOLDER, { recursive: true });

		console.log('[1/3] Obteniendo custom properties (API REST)...');
		const allReposRest = await octokit.paginate('GET /orgs/{org}/repos', {
			org: ORG_NAME,
			type: 'public',
			per_page: 100
		});

		const customPropsMap = {};
		const homepagesMap = {};
		for (const repo of allReposRest) {
			customPropsMap[repo.name] = repo.custom_properties || {};
			homepagesMap[repo.name] = repo.homepage || '';
		}

		console.log('[2/3] Obteniendo datos ricos de repositorios (GraphQL)...');
		let hasNextPage = true;
		let cursor = null;
		const graphqlRepos = [];

		const query = `
      query getRepos($org: String!, $cursor: String) {
        organization(login: $org) {
          repositories(first: 100, privacy: PUBLIC, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              description
              createdAt
              updatedAt
              url
              openGraphImageUrl
              stargazerCount
              forkCount
              issues(states: OPEN) { totalCount }
              pullRequests(states: OPEN) { totalCount }
              latestRelease { tagName publishedAt url }
              licenseInfo { name }
              repositoryTopics(first: 10) { nodes { topic { name } } }
              languages(first: 10) {
                edges {
                  size
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

		while (hasNextPage) {
			const response = await octokit.graphql(query, { org: ORG_NAME, cursor });
			const { repositories } = response.organization;
			graphqlRepos.push(...repositories.nodes);

			hasNextPage = repositories.pageInfo.hasNextPage;
			cursor = repositories.pageInfo.endCursor;
		}

		const targetRepos = graphqlRepos
			.filter((repo) => !EXCLUDED_REPOS.includes(repo.name))
			.map((repo) => ({
				name: repo.name,
				description: repo.description,
				createdAt: repo.createdAt,
				updatedAt: repo.updatedAt,
				url: repo.url,
				openGraphImageUrl: repo.openGraphImageUrl,
				stargazerCount: repo.stargazerCount,
				forkCount: repo.forkCount,
				issues: repo.issues.totalCount,
				pullRequests: repo.pullRequests.totalCount,
				latestRelease: repo.latestRelease,
				license: repo.licenseInfo.name || '',
				repositoryTopics: repo.repositoryTopics.nodes.map((n) => n.topic.name) || [],
				languages: repo.languages.edges || [],
				custom_properties: customPropsMap[repo.name] || {},
				homepage: homepagesMap[repo.name] || ''
			}));

		console.log(`  -> Guardando ${targetRepos.length} repositorios válidos en repos.json`);
		await fs.writeFile(path.join(OUT_FOLDER, 'repos.json'), JSON.stringify(targetRepos, null, 2));

		console.log('[3/3] Extrayendo contribuidores...');
		const globalContributors = new Map();
		const contributionsByRepo = {};

		for (const repo of targetRepos) {
			console.log(`  -> Procesando contribuidores de: ${repo.name}`);
			try {
				const contributorsData = await octokit.paginate('GET /repos/{owner}/{repo}/contributors', {
					owner: ORG_NAME,
					repo: repo.name,
					per_page: 100
				});

				const repoContribMap = {};

				for (const user of contributorsData) {
					if (!user.login) continue;

					repoContribMap[user.login] = user.contributions;

					if (!globalContributors.has(user.login)) {
						globalContributors.set(user.login, {
							login: user.login,
							html_url: user.html_url,
							avatar_url: user.avatar_url,
							contributions: 0
						});
					}
					globalContributors.get(user.login).contributions += user.contributions;
				}

				contributionsByRepo[repo.name] = repoContribMap;
			} catch (error) {
				console.error(`     ⚠️ Sin datos de contribuidores para ${repo.name}`);
			}
		}

		// Guardar contributors.json
		const sortedContributors = Array.from(globalContributors.values()).sort(
			(a, b) => b.contributions - a.contributions
		);
		await fs.writeFile(
			path.join(OUT_FOLDER, 'contributors.json'),
			JSON.stringify(sortedContributors, null, 2)
		);

		// Guardar contributions.json
		const totalContributions = Object.fromEntries(
			Array.from(globalContributors.entries()).map(([login, user]) => [login, user.contributions])
		);
		await fs.writeFile(
			path.join(OUT_FOLDER, 'contributions.json'),
			JSON.stringify({ repos: contributionsByRepo, total: totalContributions }, null, 2)
		);

		console.log('=== Proceso Finalizado con Éxito ===');
	} catch (error) {
		console.error('❌ Error fatal:', error.message);
		process.exit(1);
	}
}

run();
