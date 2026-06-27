import Dexie from 'dexie';

export const db = new Dexie('SpendiDB');

db.version(1).stores({
  usuarios: '++id, correo, nombre',
  presupuestos: '++id, nombre, tipo, monto, gastado, fechaInicio, fechaFin, activo',
  gastos: '++id, presupuestoId, monto, categoria, descripcion, fecha, hora',
  metas: '++id, nombre, montoObjetivo, montoActual, fechaLimite',
  grupos: '++id, nombre',
  participantes: '++id, grupoId, nombre',
  gastosGrupales: '++id, grupoId, descripcion, montoTotal, fecha',
  gastosParticipante: '++id, gastoGrupalId, participanteId, monto, pagado',
  puntos: '++id, tipo, descripcion, fecha',
  insignias: '++id, nombre, descripcion, obtenida, fecha',
  configuracion: '++id, clave, valor',
  abonosMetas: '++id, metaId, monto, fecha'
});