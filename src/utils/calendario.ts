/*
 * Layout del calendario: agrupar eventos por mes y construir la rejilla mensual.
 * Son funciones puras para que las vistas solo se preocupen de pintar.
 */

import { claveDia, formatearMesAnio, type EventoConEstado } from './eventos';

export const NOMBRES_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export type GrupoMes = { mes: string; items: EventoConEstado[] };

export type ChipEnCelda = EventoConEstado & {
	// La hora solo se muestra el primer dia del evento, los demas son continuacion
	primerDia: boolean;
};

export type Celda = {
	numero: number;
	// Clave del dia real de la celda (AAAA-MM-DD), tambien en los dias del mes vecino:
	// esos dias muestran sus eventos igual, solo que atenuados
	clave: string;
	delMesVecino: boolean;
	eventos: ChipEnCelda[];
};

export type MesCalendario = { nombre: string; items: EventoConEstado[]; celdas: Celda[] };

/** Cuantos chips entran en una celda antes de resumir el resto con "+N". */
export const MAX_CHIPS_CELDA = 3;

/**
 * La clave "YYYY-MM-DD" es un dia del calendario, no un instante: se ancla al
 * mediodia UTC para que al formatearla en hora de Chile siga siendo el mismo dia.
 */
export function fechaDeClave(clave: string): Date {
	return new Date(`${clave}T12:00:00Z`);
}

/* Agenda agrupada por mes, en orden cronologico */

export function agruparPorMes(agenda: EventoConEstado[]): GrupoMes[] {
	const grupos: GrupoMes[] = [];
	for (const item of agenda) {
		const mes = formatearMesAnio(item.evento.fechaInicio);
		const grupo = grupos.find((existente) => existente.mes === mes);
		if (grupo) grupo.items.push(item);
		else grupos.push({ mes, items: [item] });
	}
	return grupos;
}

/* Un bloque de rejilla por cada mes que tiene eventos */

export function construirMeses(agenda: EventoConEstado[], grupos: GrupoMes[]): MesCalendario[] {
	return grupos.map(({ mes: nombre, items }) => ({
		nombre,
		items,
		// La rejilla se arma sobre la fecha local del primer evento del mes, no sobre
		// los campos UTC del instante: un evento de la noche cruzaria al mes siguiente
		celdas: construirCeldas(agenda, fechaDeClave(claveDia(items[0].evento.fechaInicio)))
	}));
}

function clavesDelRango(desde: Date, hasta: Date): string[] {
	const claves: string[] = [];
	// Mediodia UTC en ambos extremos, como en fechaDeClave: si se leyera a medianoche
	// UTC, en Chile esa hora es la tarde anterior y las claves salarian un dia atrasadas
	const actual = fechaDeClave(claveDia(desde));
	const fin = fechaDeClave(claveDia(hasta));
	while (actual.getTime() <= fin.getTime()) {
		claves.push(claveDia(actual));
		actual.setUTCDate(actual.getUTCDate() + 1);
	}
	return claves;
}

const diasDelMes = (anio: number, mes: number) => new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();

function construirCeldas(agenda: EventoConEstado[], mesLocal: Date): Celda[] {
	const anio = mesLocal.getUTCFullYear();
	const mes = mesLocal.getUTCMonth();

	// Domingo es 0 en getUTCDay(), pero la semana parte el lunes
	const desplazamiento = (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7;
	const totalDias = diasDelMes(anio, mes);
	const totalCeldas = Math.ceil((desplazamiento + totalDias) / 7) * 7;

	return Array.from({ length: totalCeldas }, (_, indice) => {
		/*
		 * El dia 1 del mes cae en la columna del desplazamiento, asi que la celda pide
		 * el dia 1 mas lo que se adelanta o se atrasa. Resuelto con un Date en UTC: un
		 * dia 0 es el ultimo del mes anterior y un dia 32 el primero del siguiente, y
		 * asi cada celda sabe que dia es sin arithmeticas a mano.
		 */
		const fecha = new Date(Date.UTC(anio, mes, 1 + indice - desplazamiento));
		const clave = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}-${String(fecha.getUTCDate()).padStart(2, '0')}`;

		return {
			numero: fecha.getUTCDate(),
			clave,
			// Los dias del mes vecino se muestran atenuados, con su numero real
			delMesVecino: fecha.getUTCMonth() !== mes,
			eventos: eventosDelDia(agenda, clave)
		};
	});
}

function eventosDelDia(agenda: EventoConEstado[], clave: string): ChipEnCelda[] {
	return agenda
		.filter(({ evento }) =>
			clavesDelRango(evento.fechaInicio, evento.fechaFin ?? evento.fechaInicio).includes(clave)
		)
		.map(({ evento, estado }) => ({
			evento,
			estado,
			primerDia: claveDia(evento.fechaInicio) === clave
		}));
}
