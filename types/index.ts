export type UserRole = 'teacher' | 'admin' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  color: string;
}

export interface ClassPeriod {
  id: string;
  subjectId: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
  grade: string;
  group: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
