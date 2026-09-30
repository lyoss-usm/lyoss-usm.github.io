/*
 * Logica compartida del sistema de eventos.
 * Modulo puro: lo usan por igual el servidor (frontmatter de los .mdx) y el
 * script de cliente que calcula el estado de cada evento, para que las etiquetas
 * y los estilos tengan una sola fuente de verdad.
 */

/* Fechas: todo se interpreta en hora de Chile continental */

export const ZONA_HORARIA = 'America/Santiago';

const RE_PARTE_FECHA = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

const RE_ZONA_EXPLICITA = /(?:Z|[+-]\d{2}:\d{2})$/i;

/** Minutos que hay que restar a la hora de pared de Chile para obtener el instante UTC. */
function desfaseZona(instante: Date): number {
	const partes = new Intl.DateTimeFormat('en-US', {
		timeZone: ZONA_HORARIA,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(instante);

	const valor = (tipo: string) => Number(partes.find((parte) => parte.type === tipo)?.value);
	const horaDePared = Date.UTC(
		valor('year'),
		valor('month') - 1,
		valor('day'),
		valor('hour') % 24,
		valor('minute'),
		valor('second')
	);

	return (horaDePared - instante.getTime()) / 60000;
}

const FECHA_INVALIDA = () => new Date(Number.NaN);

/** Interpreta "2026-11-13" o "2026-11-13 18:00" como hora de Chile. */
function desdeHoraDeChile(texto: string): Date {
	const parte = RE_PARTE_FECHA.exec(texto.trim());
	if (!parte) return FECHA_INVALIDA();

	const [, anio, mes, dia, hora = '0', minuto = '0', segundo = '0'] = parte;
	const horaDePared = Date.UTC(
		Number(anio),
		Number(mes) - 1,
		Number(dia),
		Number(hora),
		Number(minuto),
		Number(segundo)
	);

	const instante = new Date(horaDePared - desfaseZona(new Date(horaDePared)) * 60000);

	// Date.UTC normaliza en silencio (2026-13-40 seria febrero de 2027), asi que
	// comprobamos que el dia resultante sea el que se escribio
	const dosDigitos = (numero: number) => String(numero).padStart(2, '0');
	const diaEsperado = `${anio}-${dosDigitos(Number(mes))}-${dosDigitos(Number(dia))}`;
	return claveDia(instante) === diaEsperado ? instante : FECHA_INVALIDA();
}

/**
 * Normaliza el valor de una fecha del frontmatter a un Date.
 *
 * Acepta, en orden de facilidad para quien redacta:
 *   fechaInicio: 2026-11-13                  -> 00:00 hora de Chile de ese dia
 *   fechaInicio: '2026-11-13 18:00'          -> 18:00 hora de Chile (entrecomillado)
 *   fechaInicio: '2026-11-13T18:00:00-03:00' -> instante absoluto (entrecomillado)
 *
 * Devuelve una Date invalida si el texto no es una fecha, y null si el valor trae
 * hora o zona pero no esta entrecomillado, porque js-yaml ya lo habria convertido
 * a un Date ambiguo.
 */
export function interpretarFecha(valor: string | Date): Date | null {
	if (valor instanceof Date) {
		const soloFecha =
			valor.getUTCHours() === 0 && valor.getUTCMinutes() === 0 && valor.getUTCSeconds() === 0;
		if (!soloFecha) return null;
		return desdeHoraDeChile(valor.toISOString().slice(0, 10));
	}

	if (RE_ZONA_EXPLICITA.test(valor)) {
		return new Date(valor);
	}

	return desdeHoraDeChile(valor);
}

/* Estado: se calcula con la fecha actual, nunca se guarda en el frontmatter */

export type EstadoEvento = 'proximo' | 'en-curso' | 'finalizado';

export const ESTADOS_EVENTO: Record<EstadoEvento, { label: string; badge: string; orden: number }> =
	{
		proximo: { label: 'Próximo', badge: 'badge-warning', orden: 0 },
		'en-curso': { label: 'En curso', badge: 'badge-success', orden: 1 },
		finalizado: { label: 'Finalizado', badge: 'badge-ghost', orden: 2 }
	};

export function calcularEstado(
	fechaInicio: Date,
	fechaFin: Date | undefined,
	ahora: Date = new Date()
): EstadoEvento {
	if (ahora.getTime() < fechaInicio.getTime()) return 'proximo';
	// Sin fechaFin el evento es puntual y pasa directo de proximo a finalizado
	if (!fechaFin) return 'finalizado';
	return ahora.getTime() <= fechaFin.getTime() ? 'en-curso' : 'finalizado';
}

/* Tipos: cada tipo tiene su color para diferenciarlos de un vistazo */

export type TipoEvento = 'institucional' | 'taller' | 'hackaton' | 'coloquio' | 'charla' | 'otro';

/* Enlaces: un evento puede tener varios, cada uno con su color de boton */

export type ColorEnlace = 'primary' | 'secondary' | 'accent' | 'neutral';

export type EnlaceEvento = {
	texto: string;
	url: string;
	color: ColorEnlace;
};

/* Evento: la forma que usan las vistas, con las fechas ya interpretadas */

export type Evento = {
	slug: string;
	titulo: string;
	tipo: TipoEvento;
	serie?: string;
	fechaInicio: Date;
	fechaFin?: Date;
	ubicacion: string;
	descripcion: string;
	enlaces: EnlaceEvento[];
	destacado?: boolean;
};

/* Un evento ya resuelto con su estado, que es lo que pintan las vistas */

export type EventoConEstado = { evento: Evento; estado: EstadoEvento };

/*
 * Adaptador: la colección de astro entrega { id, data } y las vistas quieren un Evento.
 * El id del archivo es el slug. Las fechas llegan como Date | null porque el schema
 * las valida con refine, asi que se estrechan aqui con un error claro.
 */

type EntradaEvento = {
	id: string;
	data: Omit<Evento, 'slug'> & { fechaInicio: Date | null; fechaFin?: Date | null };
};

export function aEvento(entrada: EntradaEvento): Evento {
	const { fechaInicio, fechaFin, ...resto } = entrada.data;
	if (!(fechaInicio instanceof Date) || Number.isNaN(fechaInicio.getTime())) {
		throw new Error(`El evento ${entrada.id} no tiene una fechaInicio válida`);
	}
	return {
		...resto,
		slug: entrada.id,
		fechaInicio,
		...(fechaFin ? { fechaFin } : {})
	};
}

export const TIPOS_EVENTO: Record<
	TipoEvento,
	{ label: string; badge: string; punto: string; boton: string; orden: number }
> = {
	institucional: {
		label: 'Institucional',
		badge: 'badge-primary',
		punto: 'bg-primary',
		boton: 'btn-primary',
		orden: 0
	},
	taller: {
		label: 'Taller',
		badge: 'badge-info',
		punto: 'bg-info',
		boton: 'btn-info',
		orden: 1
	},
	hackaton: {
		label: 'Hackaton',
		badge: 'badge-secondary',
		punto: 'bg-secondary',
		boton: 'btn-secondary',
		orden: 2
	},
	coloquio: {
		label: 'Coloquio',
		badge: 'badge-accent',
		punto: 'bg-accent',
		boton: 'btn-accent',
		orden: 3
	},
	charla: {
		label: 'Charla',
		badge: 'badge-success',
		punto: 'bg-success',
		boton: 'btn-success',
		orden: 4
	},
	otro: {
		label: 'Otro',
		badge: 'badge-neutral',
		punto: 'bg-neutral',
		boton: 'btn-neutral',
		orden: 5
	}
};

/* Los enlaces declaran su color por nombre, y aqui se traduce a la clase de daisyUI */

export const COLORES_ENLACE: Record<ColorEnlace, string> = {
	primary: 'btn-primary',
	secondary: 'btn-secondary',
	accent: 'btn-accent',
	neutral: 'btn-neutral'
};

/* Formateo: siempre en hora de Chile, sin importar donde se renderice */

function formateador(opciones: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat('es-CL', { timeZone: ZONA_HORARIA, ...opciones });
}

const fmtDia = formateador({ day: 'numeric' });
const fmtDiaMes = formateador({ day: 'numeric', month: 'short' });
const fmtMesCorto = formateador({ month: 'short' });
const fmtDiaMesAnio = formateador({ day: 'numeric', month: 'short', year: 'numeric' });
const fmtHora = formateador({ hour: '2-digit', minute: '2-digit', hour12: false });
const fmtLargo = formateador({
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	hour12: false
});
const fmtMesAnio = formateador({ month: 'long', year: 'numeric' });
const fmtDiaLargo = formateador({
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

/** "YYYY-MM-DD" en hora de Chile: sirve para agrupar y comparar dias. */
export function claveDia(fecha: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(fecha);
}

export function formatearHora(fecha: Date): string {
	return fmtHora.format(fecha);
}

export function formatearDia(fecha: Date): string {
	return fmtDia.format(fecha);
}

export function formatearDiaMes(fecha: Date): string {
	return fmtDiaMes.format(fecha);
}

export function formatearMesCorto(fecha: Date): string {
	return fmtMesCorto.format(fecha);
}

export function formatearMesAnio(fecha: Date): string {
	return capitalizar(fmtMesAnio.format(fecha));
}

/** "Jueves 24 de septiembre de 2026" */
export function formatearDiaLargo(fecha: Date): string {
	return capitalizar(fmtDiaLargo.format(fecha));
}

export function formatearFechaLarga(fecha: Date): string {
	return capitalizar(fmtLargo.format(fecha));
}

/** "13 nov 2026", "18:00", "13 nov 2026 · 18:00-22:00", "13 nov 18:00 - 15 nov 14:00" */
export function formatearRangoFechas(fechaInicio: Date, fechaFin?: Date): string {
	if (!fechaFin) {
		return `${fmtDiaMesAnio.format(fechaInicio)} · ${fmtHora.format(fechaInicio)}`;
	}

	if (claveDia(fechaInicio) === claveDia(fechaFin)) {
		return `${fmtDiaMesAnio.format(fechaInicio)} · ${fmtHora.format(fechaInicio)}-${fmtHora.format(fechaFin)}`;
	}

	return `${fmtDiaMes.format(fechaInicio)} ${fmtHora.format(fechaInicio)} - ${fmtDiaMes.format(fechaFin)} ${fmtHora.format(fechaFin)}`;
}

function capitalizar(texto: string): string {
	return texto.charAt(0).toUpperCase() + texto.slice(1);
}
