export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

export const SCHOOL_DAYS = [1, 2, 3, 4, 5] as const;

export const TIME_SLOTS = [
  { start: '07:00', end: '07:50' },
  { start: '07:50', end: '08:40' },
  { start: '08:40', end: '09:30' },
  { start: '09:30', end: '10:00' },
  { start: '10:00', end: '10:50' },
  { start: '10:50', end: '11:40' },
  { start: '11:40', end: '12:30' },
  { start: '12:30', end: '13:20' },
] as const;

export const SUBJECT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#FFD93D',
  '#6BCF7F',
  '#C77DFF',
  '#FF8FAB',
  '#4CC9F0',
] as const;
