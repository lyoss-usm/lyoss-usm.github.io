export interface GitHubMember {
	login: string;
	avatar_url: string;
}

export interface OrbitItem {
	src: string;
	position: string;
	size: string;
}

export interface OrbitConfig {
	size: string;
	duration: string;
	count: number;
	orbitClass: string;
	avatarClass: string;
	opacity: string;
}

export interface Orbit extends OrbitConfig {
	items: OrbitItem[];
}

const GITHUB_ORG = 'lyoss-usm';
const DEFAULT_MEMBER_COUNT = 13;

const orbitConfigs: OrbitConfig[] = [
	{
		size: 'w-[400px] h-[400px] lg:w-[600px] lg:h-[600px]',
		duration: '20s',
		count: 1,
		orbitClass: 'orbit-spin-20s',
		avatarClass: 'avatar-spin-reverse-20s',
		opacity: 'opacity-100'
	},
	{
		size: 'w-[600px] h-[600px] lg:w-[800px] lg:h-[800px]',
		duration: '35s',
		count: 4,
		orbitClass: 'orbit-spin-35s',
		avatarClass: 'avatar-spin-reverse-35s',
		opacity: 'opacity-80'
	},
	{
		size: 'w-[800px] h-[800px] lg:w-[1000px] lg:h-[1000px]',
		duration: '50s',
		count: 4,
		orbitClass: 'orbit-spin-50s',
		avatarClass: 'avatar-spin-reverse-50s',
		opacity: 'opacity-60'
	},
	{
		size: 'w-[1000px] h-[1000px] lg:w-[1200px] lg:h-[1200px]',
		duration: '75s',
		count: 4,
		orbitClass: 'orbit-spin-75s',
		avatarClass: 'avatar-spin-reverse-75s',
		opacity: 'opacity-40'
	}
];

function generatePositions(count: number): string[] {
	const positions: string[] = [];

	for (let i = 0; i < count; i++) {
		const angle = (i * 360) / count;

		if (angle === 0) {
			positions.push('top-0 left-1/2 -translate-x-1/2 -translate-y-1/2');
		} else if (angle === 90) {
			positions.push('top-1/2 right-0 translate-x-1/2 -translate-y-1/2');
		} else if (angle === 180) {
			positions.push('bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2');
		} else if (angle === 270) {
			positions.push('top-1/2 left-0 -translate-x-1/2 -translate-y-1/2');
		} else {
			const radians = (angle - 90) * (Math.PI / 180);
			const x = 50 + 50 * Math.cos(radians);
			const y = 50 + 50 * Math.sin(radians);
			positions.push(
				`top-[${y.toFixed(1)}%] left-[${x.toFixed(1)}%] -translate-x-1/2 -translate-y-1/2`
			);
		}
	}

	return positions;
}

export async function fetchGitHubMembers(): Promise<GitHubMember[]> {
	let members: GitHubMember[] = [];

	try {
		const response = await fetch(
			`https://api.github.com/orgs/${GITHUB_ORG}/members?per_page=${DEFAULT_MEMBER_COUNT}`
		);
		if (response.ok) {
			members = await response.json();
		}
	} catch (error) {
		console.error('Error cargando miembros de GitHub:', error);
	}

	for (let i = members.length; i < DEFAULT_MEMBER_COUNT; i++) {
		members.push({
			login: `ghost-${i}`,
			avatar_url: `https://github.com/identicons/${i}.png`
		});
	}

	return members.sort(() => Math.random() - 0.5);
}

export function generateOrbits(members: GitHubMember[]): Orbit[] {
	let memberIndex = 0;

	return orbitConfigs.map((config) => {
		const positions = generatePositions(config.count);
		const items: OrbitItem[] = members
			.slice(memberIndex, memberIndex + config.count)
			.map((member, i) => ({
				src: member.avatar_url,
				position: positions[i],
				size: config.count > 2 ? 'w-6 h-6 lg:w-8 lg:h-8' : 'w-10 h-10 lg:w-12 lg:h-12'
			}));

		memberIndex += config.count;

		return {
			...config,
			items
		};
	});
}

export async function getOrbitsData(): Promise<Orbit[]> {
	const members = await fetchGitHubMembers();
	return generateOrbits(members);
}
