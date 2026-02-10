import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClassPeriod } from '@/types';
import { useSubjectById, useTeacherById } from '@/contexts/AppContext';
import { Clock, MapPin, User } from 'lucide-react-native';

interface ScheduleCardProps {
  classPeriod: ClassPeriod;
}

export function ScheduleCard({ classPeriod }: ScheduleCardProps) {
  const subject = useSubjectById(classPeriod.subjectId);
  const teacher = useTeacherById(subject?.teacherId || '');

  if (!subject) return null;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[subject.color, `${subject.color}DD`]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{classPeriod.startTime}</Text>
          <Text style={styles.timeSeparator}>-</Text>
          <Text style={styles.timeText}>{classPeriod.endTime}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          
          <View style={styles.infoRow}>
            <Clock size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            <Text style={styles.infoText}>
              {calculateDuration(classPeriod.startTime, classPeriod.endTime)} min
            </Text>
          </View>

          {teacher && (
            <View style={styles.infoRow}>
              <User size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
              <Text style={styles.infoText}>{teacher.name}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <MapPin size={16} color="rgba(255,255,255,0.9)" strokeWidth={2} />
            <Text style={styles.infoText}>Salón {classPeriod.room}</Text>
          </View>

          <View style={styles.gradeTag}>
            <Text style={styles.gradeText}>
              {classPeriod.grade}° {classPeriod.group}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  gradient: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  timeSeparator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginVertical: 2,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
  },
  gradeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
