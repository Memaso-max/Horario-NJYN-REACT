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

  // Periodic check for remote updates (polling). Runs every 60 seconds.
  useEffect(() => {
    const id = setInterval(() => {
      checkForUpdates().catch(() => {});
    }, 60 * 1000);
    return () => clearInterval(id);
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
    await saveLocalMetaAndPush();
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const newUsers = users.map(u => u.id === userId ? { ...u, ...updates } : u);
    setUsers(newUsers);
    await AsyncStorage.setItem('users', JSON.stringify(newUsers));
    await saveLocalMetaAndPush();
  };

  const deleteUser = async (userId: string) => {
    const newUsers = users.filter(u => u.id !== userId);
    setUsers(newUsers);
    await AsyncStorage.setItem('users', JSON.stringify(newUsers));
    await saveLocalMetaAndPush();
  };

  const addSubject = async (subject: Subject) => {
    const newSubjects = [...subjects, subject];
    setSubjects(newSubjects);
    await AsyncStorage.setItem('subjects', JSON.stringify(newSubjects));
    await saveLocalMetaAndPush();
  };

  const updateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    const newSubjects = subjects.map(s => s.id === subjectId ? { ...s, ...updates } : s);
    setSubjects(newSubjects);
    await AsyncStorage.setItem('subjects', JSON.stringify(newSubjects));
    await saveLocalMetaAndPush();
  };

  const deleteSubject = async (subjectId: string) => {
    const newSubjects = subjects.filter(s => s.id !== subjectId);
    setSubjects(newSubjects);
    const newSchedule = schedule.filter(c => c.subjectId !== subjectId);
    setSchedule(newSchedule);
    await AsyncStorage.setItem('subjects', JSON.stringify(newSubjects));
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
    await saveLocalMetaAndPush();
  };

  const addClassPeriod = async (classPeriod: ClassPeriod) => {
    const newSchedule = [...schedule, classPeriod];
    setSchedule(newSchedule);
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
    await saveLocalMetaAndPush();
  };

  const updateClassPeriod = async (periodId: string, updates: Partial<ClassPeriod>) => {
    const newSchedule = schedule.map(c => c.id === periodId ? { ...c, ...updates } : c);
    setSchedule(newSchedule);
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
    await saveLocalMetaAndPush();
  };

  const deleteClassPeriod = async (periodId: string) => {
    const newSchedule = schedule.filter(c => c.id !== periodId);
    setSchedule(newSchedule);
    await AsyncStorage.setItem('schedule', JSON.stringify(newSchedule));
    await saveLocalMetaAndPush();
  };

  // Update local lastUpdated timestamp and attempt to push to GitHub if token exists
  async function saveLocalMetaAndPush() {
    const newLast = new Date().toISOString();
    setLastUpdated(newLast);
    await AsyncStorage.setItem('lastUpdated', newLast);
    try {
      // pushToGitHub is defined later; attempt it if available
      // @ts-ignore
      if (typeof pushToGitHub === 'function') await pushToGitHub();
    } catch (e) {
      console.log('pushToGitHub failed:', e);
    }
  }

  // Push current data to GitHub using the Contents API. Requires a Personal Access Token with repo permissions.
  const pushToGitHub = async (token?: string, commitMessage?: string) => {
    const GITHUB_OWNER = 'Memaso-max';
    const GITHUB_REPO = 'Horario-NJYN-REACT';
    const DATA_PATH = 'data.json';
    const META_PATH = 'data_meta.json';

    const usedToken = token || (await AsyncStorage.getItem('githubToken'));
    if (!usedToken) throw new Error('GitHub token required');

    const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

    const newLast = new Date().toISOString();

    const dataPayload = {
      users,
      subjects,
      schedule,
      lastUpdated: newLast,
    };

    const metaPayload = { lastUpdated: newLast };

    const encode = (obj: any) => {
      const str = JSON.stringify(obj, null, 2);
      try {
        return Buffer.from(str, 'utf8').toString('base64');
      } catch (e) {
        // fallback to btoa if available
        // @ts-ignore
        if (typeof btoa === 'function') return btoa(str);
        throw new Error('No base64 encoder available in environment');
      }
    };

    const headers = {
      Authorization: `token ${usedToken}`,
      Accept: 'application/vnd.github+json',
    } as any;

    const getSha = async (path: string) => {
      const res = await fetch(`${apiBase}/${encodeURIComponent(path)}`, { headers });
      if (res.status === 200) {
        const j = await res.json();
        return j.sha as string | null;
      }
      return null;
    };

    const putFile = async (path: string, contentB64: string, message: string, sha?: string | null) => {
      const body: any = { message, content: contentB64 };
      if (sha) body.sha = sha;
      const res = await fetch(`${apiBase}/${encodeURIComponent(path)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GitHub API error: ${res.status} ${text}`);
      }
      return await res.json();
    };

    // prepare and push data.json
    const dataB64 = encode(dataPayload);
    const metaB64 = encode(metaPayload);

    const message = commitMessage || 'App: update data.json from app';

    const dataSha = await getSha(DATA_PATH);
    await putFile(DATA_PATH, dataB64, message, dataSha);

    const metaSha = await getSha(META_PATH);
    await putFile(META_PATH, metaB64, `${message} (meta)`, metaSha);

    // Persist the new lastUpdated locally
    setLastUpdated(newLast);
    await AsyncStorage.setItem('lastUpdated', newLast);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    await AsyncStorage.setItem('subjects', JSON.stringify(subjects));
    await AsyncStorage.setItem('schedule', JSON.stringify(schedule));

    // Optionally persist token for future use
    try {
      await AsyncStorage.setItem('githubToken', usedToken);
    } catch (_) {
      // ignore
    }

    return { ok: true, lastUpdated: newLast };
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
    pushToGitHub,
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
