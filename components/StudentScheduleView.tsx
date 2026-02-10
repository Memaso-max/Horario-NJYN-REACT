import { DAYS_OF_WEEK, SCHOOL_DAYS } from '@/constants/schedule';
import { useAllGradeGroups, useApp, useGradeGroupSchedule } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { GraduationCap, LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScheduleCard } from './ScheduleCard';

export function StudentScheduleView() {
  const router = useRouter();
  const { logout } = useApp();
  const allGradeGroups = useAllGradeGroups();
  const [selectedGradeGroup, setSelectedGradeGroup] = useState<string>(allGradeGroups[0] || '');
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(
    SCHOOL_DAYS.includes(today as any) ? today : 1
  );
  
  const gradeGroupSchedule = useGradeGroupSchedule(selectedGradeGroup, selectedDay);

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <GraduationCap size={24} color="#E67E22" strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Horarios por Sección</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#E67E22" />
        </TouchableOpacity>
      </View>

      {/* Barra de grados eliminada según solicitud del usuario */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {SCHOOL_DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDay === day && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Text
              style={[
                styles.dayButtonText,
                selectedDay === day && styles.dayButtonTextActive,
              ]}
            >
              {DAYS_OF_WEEK[day].substring(0, 3)}
            </Text>
            <Text
              style={[
                styles.dayButtonTextFull,
                selectedDay === day && styles.dayButtonTextActive,
              ]}
            >
              {DAYS_OF_WEEK[day]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scheduleList}
        contentContainerStyle={styles.scheduleListContent}
        showsVerticalScrollIndicator={false}
      >
        {gradeGroupSchedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No hay clases programadas para esta sección
            </Text>
          </View>
        ) : (
          gradeGroupSchedule.map((period) => (
            <ScheduleCard key={period.id} classPeriod={period} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#2C3E50',
  },
  logoutButton: {
    padding: 8,
  },
  gradeGroupSelector: {
    maxHeight: 60,
  },
  gradeGroupSelectorContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 8,
  },
  gradeGroupButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  gradeGroupButtonActive: {
    backgroundColor: '#E67E22',
  },
  gradeGroupButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#7F8C8D',
  },
  gradeGroupButtonTextActive: {
    color: '#fff',
  },
  daySelector: {
    maxHeight: 70,
  },
  daySelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingVertical: 8,
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#7F8C8D',
  },
  dayButtonTextFull: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 2,
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  scheduleList: {
    flex: 1,
  },
  scheduleListContent: {
    padding: 20,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
});
