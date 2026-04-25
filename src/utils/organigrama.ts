// src/utils/organigrama.ts

// Usamos any o el tipo inferido de Astro para no complicar el tipado aquí, 
// pero asumiendo que `miembros` es el array que viene de getCollection('nosotros')
export function procesarEstructuraOrganigrama(miembros: any[]) {
  // 1. Extraer Presidencia
  const presidenciaData = miembros.find((m) => m.esPresidencia);
  const presidencia = presidenciaData ? {
    ...presidenciaData,
    cargo: presidenciaData.rol
  } : null;

  // 2. Función interna para armar un área específica
  const construirArea = (areaId: string, titulo: string, color: 'primary' | 'secondary') => {
    const miembrosArea = miembros.filter((m) => m.area === areaId);
    
    // Buscar la jefatura del área
    const jefaturaData = miembrosArea.find((m) => m.esJefaturaArea);
    const jefatura = jefaturaData ? {
      ...jefaturaData,
      cargo: jefaturaData.cargoJefatura
    } : null;

    // Agrupar subáreas (equipos)
    const equiposMap = new Map();

    miembrosArea.forEach((m) => {
      if (!m.equipo) return;

      if (!equiposMap.has(m.equipo)) {
        equiposMap.set(m.equipo, {
          titulo: m.equipo,
          // Si este miembro tiene la descripción, la guardamos. Si no, usamos string vacío por defecto.
          descripcion: m.descripcionEquipo || '',
          orden: m.ordenEquipo || 999,
          personas: []
        });
      }

      const equipo = equiposMap.get(m.equipo);
      // Si un miembro posterior del mismo equipo tiene la descripción, la actualizamos
      if (m.descripcionEquipo) equipo.descripcion = m.descripcionEquipo;
      
      // Ajustamos el orden del equipo completo basado en el miembro con el número más bajo
      equipo.orden = Math.min(equipo.orden, m.ordenEquipo || 999);
      
      // Agregamos a la persona
      equipo.personas.push({
        ...m,
        cargo: m.cargoEquipo,
        ordenPersona: m.ordenEquipo || 999
      });
    });

    // Ordenar las subáreas y las personas dentro de ellas
    const subareas = Array.from(equiposMap.values())
      .sort((a, b) => a.orden - b.orden)
      .map((equipo) => {
        // Ordenar personas dentro del equipo
        equipo.personas.sort((a: any, b: any) => a.ordenPersona - b.ordenPersona);
        return equipo;
      });

    return {
      titulo,
      color,
      jefatura,
      subareas
    };
  };

  return {
    presidencia,
    areaAdministrativa: construirArea('administrativa', 'Área Administrativa', 'secondary'),
    areaTecnologica: construirArea('tecnologica', 'Área Tecnológica', 'primary')
  };
}

export function filtrarMiembrosPorEstado(miembros: any[], estado: 'activo' | 'inactivo') {
  return miembros.filter((m) => m.estado === estado);
}