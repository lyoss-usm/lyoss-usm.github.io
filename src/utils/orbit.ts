import members from '../content/nosotros/miembros.json';

export interface Member {
    avatar: string;
    [key: string]: any; 
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

const DEFAULT_MEMBER_COUNT = 13;


const avatarImages = import.meta.glob<{ default: string }>('/src/assets/avatar/*.{png,jpg,jpeg,webp,svg}', {
    eager: true
});

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

function resolveSource(path: string): string {
    if (path.startsWith('http')) {
        return path;
    }

    if (avatarImages[path]) {
        return avatarImages[path].default;
    }

    console.warn(`Imagen local no encontrada: ${path}`);
    return path;
}

export function generateOrbits(members: Member[]): Orbit[] {
	let memberIndex = 0;

	const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

		while (shuffledMembers.length < DEFAULT_MEMBER_COUNT) {
			shuffledMembers.push({
				nombre: 'Ghost',
				rol: 'Ghost',
				bio: '',
				avatar: `https://github.com/identicons/${shuffledMembers.length}.png`
			});
		}

	return orbitConfigs.map((config) => {
		const positions = generatePositions(config.count);
		const orbitMembers = shuffledMembers.slice(memberIndex, memberIndex + config.count);
				
		const items: OrbitItem[] = orbitMembers.map((member, i) => ({
			src: resolveSource(member.avatar),
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
export function getOrbitsData(): Orbit[] {
    return generateOrbits(members as Member[]);
}
