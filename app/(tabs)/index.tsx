import { StudentScheduleView } from '@/components/StudentScheduleView';
import { ScheduleView } from '@/components/ScheduleView';
import { useApp } from '@/contexts/AppContext';

export default function ScheduleScreen() {
  const { currentUser } = useApp();

  if (currentUser?.role === 'teacher') {
    return <ScheduleView />;
  }

  return <StudentScheduleView />;
}

