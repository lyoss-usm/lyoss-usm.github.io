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
	// Clave del dia (AAAA-MM-DD) si la celda pertenece al mes, null si es del vecino
	clave: string | null;
	delMesVecino: boolean;
	eventos: ChipEnCelda[];
};

export type MesCalendario = { nombre: string; items: EventoConEstado[]; celdas: Celda[] };

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
		celdas: construirCeldas(agenda, items[0].evento.fechaInicio)
	}));
}

function clavesDelRango(desde: Date, hasta: Date): string[] {
	const claves: string[] = [];
	const actual = new Date(`${claveDia(desde)}T00:00:00Z`);
	const fin = new Date(`${claveDia(hasta)}T00:00:00Z`);
	while (actual.getTime() <= fin.getTime()) {
		claves.push(claveDia(actual));
		actual.setUTCDate(actual.getUTCDate() + 1);
	}
	return claves;
}

const diasDelMes = (anio: number, mes: number) => new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();

function construirCeldas(agenda: EventoConEstado[], primeraFecha: Date): Celda[] {
	const anio = primeraFecha.getUTCFullYear();
	const mes = primeraFecha.getUTCMonth();

	// Domingo es 0 en getUTCDay(), pero la semana parte el lunes
	const desplazamiento = (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7;
	const totalDias = diasDelMes(anio, mes);
	const totalCeldas = Math.ceil((desplazamiento + totalDias) / 7) * 7;

	const clave = (dia: number) =>
		`${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

	return Array.from({ length: totalCeldas }, (_, indice) => {
		const numero = indice - desplazamiento + 1;
		const dentroDelMes = numero >= 1 && numero <= totalDias;
		// Los dias del mes vecino se muestran atenuados, con su numero real
		const diaVecino = numero < 1 ? numero + diasDelMes(anio, mes - 1) : numero - totalDias;
		const claveCelda = dentroDelMes ? clave(numero) : null;

		return {
			numero: dentroDelMes ? numero : diaVecino,
			clave: claveCelda,
			delMesVecino: !dentroDelMes,
			eventos: claveCelda ? eventosDelDia(agenda, claveCelda) : []
		};
	});
}

function eventosDelDia(agenda: EventoConEstado[], clave: string): ChipEnCelda[] {
	return agenda
		.filter(({ evento }) =>
			clavesDelRango(evento.fechaInicio, evento.fechaFin ?? evento.fechaInicio).includes(clave)
		)
		.slice(0, 3)
		.map(({ evento, estado }) => ({
			evento,
			estado,
			primerDia: claveDia(evento.fechaInicio) === clave
		}));
}
