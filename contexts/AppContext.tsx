import { MOCK_SCHEDULE, MOCK_SUBJECTS, MOCK_USERS } from '@/mocks/data';
import { ClassPeriod, Subject, User } from '@/types';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

// Remote URLs (raw GitHub). You provided the repo HTML URLs:
// https://github.com/Memaso-max/Horario-NJYN-REACT/blob/main/data.json
// https://github.com/Memaso-max/Horario-NJYN-REACT/blob/main/data_meta.json
// Use raw.githubusercontent.com endpoints for fetching JSON content directly.
const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/Memaso-max/Horario-NJYN-REACT/main/data.json';
const REMOTE_META_URL = 'https://raw.githubusercontent.com/Memaso-max/Horario-NJYN-REACT/main/data_meta.json';

export const [AppProvider, useApp] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [schedule, setSchedule] = useState<ClassPeriod[]>(MOCK_SCHEDULE);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      const storedUsers = await AsyncStorage.getItem('users');
      const storedSubjects = await AsyncStorage.getItem('subjects');
      const storedSchedule = await AsyncStorage.getItem('schedule');

      if (storedUser) setCurrentUser(JSON.parse(storedUser));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedSubjects) setSubjects(JSON.parse(storedSubjects));
      if (storedSchedule) setSchedule(JSON.parse(storedSchedule));
      const storedLast = await AsyncStorage.getItem('lastUpdated');
      if (storedLast) setLastUpdated(storedLast);
      // If local DB is empty, attempt to sync from remote
      if (!storedUsers || !storedSubjects || !storedSchedule) {
        // try to silently fetch remote data
        try {
          await syncFromRemote();
        } catch (e) {
          console.log('No remote data available or offline:', e);
        }
      } else {
        // If local exists, check remote meta for updates (best-effort)
        try {
          await checkForUpdates();
        } catch (e) {
          // ignore network errors
        }
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch full data from remote JSON and overwrite local storage (used for initial download and updates)
  const syncFromRemote = async () => {
    const res = await fetch(REMOTE_DATA_URL);
    if (!res.ok) throw new Error('Failed to fetch remote data');
    const remote = await res.json();

    const remoteUsers: User[] = remote.users || [];
    const remoteSubjects: Subject[] = remote.subjects || [];
    const remoteSchedule: ClassPeriod[] = remote.schedule || [];
    const remoteLastUpdated: string | undefined = remote.lastUpdated;

    setUsers(remoteUsers);
    setSubjects(remoteSubjects);
    setSchedule(remoteSchedule);

    await AsyncStorage.setItem('users', JSON.stringify(remoteUsers));
    await AsyncStorage.setItem('subjects', JSON.stringify(remoteSubjects));
    await AsyncStorage.setItem('schedule', JSON.stringify(remoteSchedule));
    const dateToSave = remoteLastUpdated || String(Date.now());
    setLastUpdated(dateToSave);
    await AsyncStorage.setItem('lastUpdated', dateToSave);
  };

  // Check remote meta (or data) to decide if an update is needed
  const checkForUpdates = async () => {
    try {
      // Try meta endpoint first
      let remoteMeta: { lastUpdated?: string } | null = null;
      try {
        const metaRes = await fetch(REMOTE_META_URL);
        if (metaRes.ok) {
          remoteMeta = await metaRes.json();
        }
      } catch (e) {
        // ignore
      }

      if (!remoteMeta) {
        // fallback: fetch data and read lastUpdated field
        const dataRes = await fetch(REMOTE_DATA_URL);
        if (!dataRes.ok) return;
        const dataJson = await dataRes.json();
        remoteMeta = { lastUpdated: dataJson.lastUpdated };
      }

      const localLast = await AsyncStorage.getItem('lastUpdated');
      const remoteLast = remoteMeta?.lastUpdated;
      if (remoteLast && (!localLast || remoteLast !== localLast)) {
        // update local silently
        await syncFromRemote();
      }
    } catch (e) {
      // network or parsing error — ignore silently
      console.log('Update check failed:', e);
    }
  };

  const login = async (user: User) => {
    setCurrentUser(user);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem('currentUser');
  };

  const addUser = async (user: User) => {
    const newUsers = [...users, user];
    setUsers(newUsers);
    await AsyncStorage.setItem('users', JSON.stringify(newUsers));
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(newUsers);
    await AsyncStorage.setItem('users', JSON.stringify(newUsers));
  };

  const deleteUser = async (userId: string) => {
    const newUsers = users.filter(u => u.id !== userId);
    setUsers(newUsers);
    await AsyncStorage.setItem('users', JSON.stringify(newUsers));
  };

  const addSubject = async (subject: Subject) => {
    const newSubjects = [...subjects, subject];
    setSubjects(newSubjects);
    await AsyncStorage.setItem('subjects', JSON.stringify(newSubjects));
  };

  const updateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, ...updates } : s);
    setSubjects(newSubjects);
    await AsyncStorage.setItem('subjects', JSON.stringify(newSubjects));
  };

  const deleteSubject = async (subjectId: string) => {
    const newSubjects = subjects.filter(s => s.id !== subjectId);
    setSubjects(newSubjects);
    const newSchedule = schedule.filter(c => c.subjectId !== subjectId);
    setSchedule(newSchedule);
    await AsyncStorage.setItem('subjects', JSON.stringify(newSubjects));
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
  };

  const addClassPeriod = async (classPeriod: ClassPeriod) => {
    const newSchedule = [...schedule, classPeriod];
    setSchedule(newSchedule);
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
  };

  const updateClassPeriod = async (periodId: string, updates: Partial<ClassPeriod>) => {
    const newSchedule = schedule.map(c => c.id === periodId ? { ...c, ...updates } : c);
    setSchedule(newSchedule);
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
  };

  const deleteClassPeriod = async (periodId: string) => {
    const newSchedule = schedule.filter(c => c.id !== periodId);
    setSchedule(newSchedule);
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
  };

  return {
    currentUser,
    users,
    subjects,
    schedule,
    lastUpdated,
    isLoading,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    addSubject,
    updateSubject,
    deleteSubject,
    addClassPeriod,
    updateClassPeriod,
    deleteClassPeriod,
    // allow manual/forced sync (admin can call this)
    forceSync: syncFromRemote,
  };
});

export const useUserSchedule = (day?: number) => {
  const { currentUser, schedule, subjects } = useApp();

  return useMemo(() => {
    if (!currentUser) return [];

    let filtered = schedule;

    if (currentUser.role === 'teacher') {
      const teacherSubjects = subjects.filter(s => s.teacherId === currentUser.id);
      const subjectIds = teacherSubjects.map(s => s.id);
      filtered = schedule.filter(c => subjectIds.includes(c.subjectId));
    }

    if (day !== undefined) {
      filtered = filtered.filter(c => c.day === day);
    }

    return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [currentUser, schedule, subjects, day]);
};

export const useRoomSchedule = (room: string, day?: number) => {
  const { schedule } = useApp();

  return useMemo(() => {
    let filtered = schedule.filter(c => c.room === room);

    if (day !== undefined) {
      filtered = filtered.filter(c => c.day === day);
    }

    return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedule, room, day]);
};

export const useAllRooms = () => {
  const { schedule } = useApp();

  return useMemo(() => {
    const rooms = new Set(schedule.map(c => c.room));
    return Array.from(rooms).sort();
  }, [schedule]);
};

export const useAllGradeGroups = () => {
  const { schedule } = useApp();

  return useMemo(() => {
    const gradeGroups = new Set(schedule.map(c => `${c.grade}${c.group}`));
    return Array.from(gradeGroups).sort();
  }, [schedule]);
};

export const useGradeGroupSchedule = (gradeGroup: string, day?: number) => {
  const { schedule } = useApp();

  return useMemo(() => {
    if (!gradeGroup) return [];

    const grade = gradeGroup.slice(0, -1);
    const group = gradeGroup.slice(-1);

    let filtered = schedule.filter(c => c.grade === grade && c.group === group);

    if (day !== undefined) {
      filtered = filtered.filter(c => c.day === day);
    }

    return filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedule, gradeGroup, day]);
};

export const useSubjectById = (subjectId: string) => {
  const { subjects } = useApp();
  return useMemo(() => subjects.find(s => s.id === subjectId), [subjects, subjectId]);
};

export const useTeacherById = (teacherId: string) => {
  const { users } = useApp();
  return useMemo(() => users.find(u => u.id === teacherId && u.role === 'teacher'), [users, teacherId]);
};
