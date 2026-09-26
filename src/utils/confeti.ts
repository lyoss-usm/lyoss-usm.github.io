type Particula = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	giro: number;
	velocidadGiro: number;
	tamano: number;
	color: string;
};

type Nivel = {
	nombre: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	/** Ancho maximo en px de este nivel */
	hasta: number;
	piezas: number;
	/** Multiplicador del tamano de cada pieza */
	tamano: number;
	/** Fraccion de la altura del canvas que sube la descarga */
	recorrido: number;
	duracion: number;
};

/* Mismos cortes que los breakpoints del tema: xs 400, sm 640, md 768, lg 1024, xl 1280 */
const NIVELES: Nivel[] = [
	{ nombre: 'xs', hasta: 400, piezas: 50, tamano: 0.75, recorrido: 0.3, duracion: 1600 },
	{ nombre: 'sm', hasta: 640, piezas: 65, tamano: 0.85, recorrido: 0.34, duracion: 1800 },
	{ nombre: 'md', hasta: 768, piezas: 80, tamano: 0.95, recorrido: 0.38, duracion: 2000 },
	{ nombre: 'lg', hasta: 1024, piezas: 95, tamano: 1, recorrido: 0.4, duracion: 2200 },
	{
		nombre: 'xl',
		hasta: Number.POSITIVE_INFINITY,
		piezas: 110,
		tamano: 1.05,
		recorrido: 0.42,
		duracion: 2200
	}
];

const COLORES = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#f472b6'];
const GRAVEDAD = 0.22;
const ROZAMIENTO = 0.99;

function nivelPara(ancho: number): Nivel {
	return NIVELES.find((nivel) => ancho <= nivel.hasta) ?? NIVELES[NIVELES.length - 1];
}

/** Lanza el confeti usando el aviso como punto de partida de la descarga. */
export function lanzarConfeti(ancla: HTMLElement): void {
	// 1. El canvas ocupa la pantalla. Un canvas es un elemento reemplazado, asi que
	// con solo inset-0 no se estira y hay que darle el tamano explicito
	const canvas = document.createElement('canvas');
	canvas.className = 'pointer-events-none fixed inset-0 h-full w-full z-100';
	canvas.setAttribute('aria-hidden', 'true');
	document.body.append(canvas);

	const contexto = canvas.getContext('2d');
	if (!contexto) {
		canvas.remove();
		return;
	}

	// 2. Se mide la pantalla con el canvas ya puesto, no se supone el tamano de la ventana
	let pantalla = canvas.getBoundingClientRect();
	let ancho = pantalla.width;
	let alto = pantalla.height;
	canvas.dataset.nivel = nivelPara(ancho).nombre;

	const dimensionar = () => {
		// El ratio del dispositivo va solo en el buffer de dibujo: el CSS sigue
		// mandando el tamano, asi la escala no deforma las particulas
		const escala = window.devicePixelRatio || 1;
		canvas.width = Math.round(ancho * escala);
		canvas.height = Math.round(alto * escala);
		contexto.setTransform(escala, 0, 0, escala, 0, 0);
	};
	dimensionar();

	// 3. El centro de la notificacion,readido a coordenadas del canvas
	const cajaAncla = ancla.getBoundingClientRect();
	const origen = {
		x: cajaAncla.left + cajaAncla.width / 2 - pantalla.left,
		y: cajaAncla.top + cajaAncla.height / 2 - pantalla.top
	};

	// 4. La descarga se arma con los numeros del nivel
	const nivel = nivelPara(ancho);
	// v = raiz de 2gh: la velocidad necesaria para subir la fraccion del nivel
	const velocidadMaxima = Math.sqrt(2 * GRAVEDAD * alto * nivel.recorrido);

	const particulas: Particula[] = Array.from({ length: nivel.piezas }, () => {
		// abanico hacia arriba, con algo de dispersion a los lados
		const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
		const velocidad = velocidadMaxima * (0.55 + Math.random() * 0.45);
		return {
			x: origen.x,
			y: origen.y,
			vx: Math.cos(angulo) * velocidad,
			vy: Math.sin(angulo) * velocidad,
			giro: Math.random() * Math.PI,
			velocidadGiro: (Math.random() - 0.5) * 0.3,
			tamano: (6 + Math.random() * 5) * nivel.tamano,
			color: COLORES[Math.floor(Math.random() * COLORES.length)]
		};
	});

	// 5. Al girar el telefono el canvas cambia de medida y hay que reajustar
	const alRedimensionar = () => {
		pantalla = canvas.getBoundingClientRect();
		ancho = pantalla.width;
		alto = pantalla.height;
		canvas.dataset.nivel = nivelPara(ancho).nombre;
		dimensionar();
	};
	window.addEventListener('resize', alRedimensionar);

	const inicio = performance.now();
	const dibujar = (ahora: number) => {
		const t = ahora - inicio;
		contexto.clearRect(0, 0, ancho, alto);

		for (const particula of particulas) {
			particula.vy += GRAVEDAD;
			particula.vx *= ROZAMIENTO;
			particula.x += particula.vx;
			particula.y += particula.vy;
			particula.giro += particula.velocidadGiro;

			contexto.save();
			contexto.translate(particula.x, particula.y);
			contexto.rotate(particula.giro);
			contexto.globalAlpha = Math.max(0, 1 - t / nivel.duracion);
			contexto.fillStyle = particula.color;
			contexto.fillRect(
				-particula.tamano / 2,
				-particula.tamano / 4,
				particula.tamano,
				particula.tamano / 2
			);
			contexto.restore();
		}

		if (t < nivel.duracion) {
			requestAnimationFrame(dibujar);
			return;
		}
		window.removeEventListener('resize', alRedimensionar);
		canvas.remove();
	};
	requestAnimationFrame(dibujar);
}
