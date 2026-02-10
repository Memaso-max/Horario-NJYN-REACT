import { DAYS_OF_WEEK, SCHOOL_DAYS, SUBJECT_COLORS } from '@/constants/schedule';
import { useAllGradeGroups, useApp } from '@/contexts/AppContext';
import { ClassPeriod, Subject, User, UserRole } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, Calendar, LogOut, Plus, Settings, Trash2, Users, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type AdminTab = 'users' | 'subjects' | 'schedule';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('schedule');
  const { logout } = useApp();
  const { forceSync, lastUpdated } = useApp();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace('/welcome');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Settings size={28} color="#E67E22" strokeWidth={2.5} />
        <Text style={styles.headerTitle}>Panel de Administración</Text>
        <TouchableOpacity
          onPress={async () => {
            setSyncError(null);
            setIsSyncing(true);
            try {
              await forceSync?.();
              Alert.alert('Sincronización', 'Actualizado correctamente');
            } catch (e: any) {
              const msg = e?.message || 'No fue posible sincronizar';
              setSyncError(msg);
              Alert.alert('Sincronización', `No fue posible sincronizar: ${msg}`);
            } finally {
              setIsSyncing(false);
            }
          }}
          style={styles.syncButton}
        >
          <Text style={styles.syncText}>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color="#E67E22" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Calendar size={20} color={activeTab === 'schedule' ? '#fff' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
            Horarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'subjects' && styles.tabActive]}
          onPress={() => setActiveTab('subjects')}
        >
          <BookOpen size={20} color={activeTab === 'subjects' ? '#fff' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'subjects' && styles.tabTextActive]}>
            Materias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Users size={20} color={activeTab === 'users' ? '#fff' : '#7F8C8D'} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Usuarios
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'schedule' && <ScheduleManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'users' && <UserManagement />}
      </View>
    </View>
  );
}

function ConfirmModal({ visible, title, message, onCancel, onConfirm }: { visible: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void; }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity style={[styles.confirmButton, styles.confirmCancel]} onPress={onCancel}>
              <Text style={styles.confirmCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButton, styles.confirmDelete]} onPress={onConfirm}>
              <Text style={styles.confirmDeleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ScheduleManagement() {
  const { schedule, deleteClassPeriod, addClassPeriod, subjects } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [formData, setFormData] = useState({
    subjectId: '',
    startTime: '07:00',
    endTime: '07:50',
    room: '',
    grade: '1',
    group: 'A',
  });

  const gradeGroups = useAllGradeGroups();
  const [selectedGradeGroup, setSelectedGradeGroup] = useState<string>('');

  useEffect(() => {
    if (!selectedGradeGroup && gradeGroups.length > 0) setSelectedGradeGroup(gradeGroups[0]);
  }, [gradeGroups]);

  const daySchedule = schedule
    .filter(c => c.day === selectedDay)
    .filter(c => {
      if (!selectedGradeGroup) return true;
      const grade = selectedGradeGroup.slice(0, -1);
      const group = selectedGradeGroup.slice(-1);
      return c.grade === grade && c.group === group;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmVisible(true);
  };

  const doDelete = async () => {
    if (pendingDeleteId) await deleteClassPeriod(pendingDeleteId);
    setPendingDeleteId(null);
    setConfirmVisible(false);
  };

  const handleAdd = async () => {
    if (!formData.subjectId || !formData.room) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const newClass: ClassPeriod = {
      id: `c${Date.now()}`,
      subjectId: formData.subjectId,
      day: selectedDay,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room,
      grade: formData.grade,
      group: formData.group,
    };

    await addClassPeriod(newClass);
    setModalVisible(false);
    setFormData({
      subjectId: '',
      startTime: '07:00',
      endTime: '07:50',
      room: '',
      grade: '1',
      group: 'A',
    });
  };

  return (
    <View style={styles.managementContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daySelector}
        contentContainerStyle={styles.daySelectorContent}
      >
        {SCHOOL_DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayButtonText, selectedDay === day && styles.dayButtonTextActive]}>
              {DAYS_OF_WEEK[day]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {gradeGroups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gradeSelector}
          contentContainerStyle={styles.daySelectorContent}
        >
          {gradeGroups.map((gg) => (
            <TouchableOpacity
              key={gg}
              style={[styles.gradeButton, selectedGradeGroup === gg && styles.dayButtonActive]}
              onPress={() => setSelectedGradeGroup(gg)}
            >
              <Text style={[styles.dayButtonText, selectedGradeGroup === gg && styles.dayButtonTextActive]}>{gg.replace(/\s*grado$/i, '')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {daySchedule.map((period) => {
          const subject = subjects.find(s => s.id === period.subjectId);
          return (
            <View key={period.id} style={styles.itemCard}>
              <View style={[styles.colorBar, { backgroundColor: subject?.color }]} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{subject?.name}</Text>
                <Text style={styles.itemSubtext}>
                  {period.startTime} - {period.endTime} • Salón {period.room}
                </Text>
                <Text style={styles.itemSubtext}>
                  {period.grade}° {period.group}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(period.id)}
              >
                <Trash2 size={20} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#E67E22', '#D35400']} style={styles.fabGradient}>
          <Plus size={28} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Clase</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Materia</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {subjects.map((subject) => (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectChip,
                        { backgroundColor: subject.color },
                        formData.subjectId === subject.id && styles.subjectChipSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, subjectId: subject.id })}
                    >
                      <Text style={styles.subjectChipText}>{subject.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Horario</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    value={formData.startTime}
                    onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                    placeholder="07:00"
                  />
                </View>
                <Text style={styles.timeSeparator}>-</Text>
                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    value={formData.endTime}
                    onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                    placeholder="07:50"
                  />
                </View>
              </View>

              <Text style={styles.label}>Salón</Text>
              <TextInput
                style={styles.input}
                value={formData.room}
                onChangeText={(text) => setFormData({ ...formData, room: text })}
                placeholder="Ej: 101"
              />

              <Text style={styles.label}>Grado y Grupo</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    value={formData.grade}
                    onChangeText={(text) => setFormData({ ...formData, grade: text })}
                    placeholder="Grado"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    value={formData.group}
                    onChangeText={(text) => setFormData({ ...formData, group: text })}
                    placeholder="Grupo"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <LinearGradient colors={['#E67E22', '#D35400']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Agregar Clase</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar Clase"
        message="¿Estás seguro de eliminar esta clase?"
        onCancel={() => { setConfirmVisible(false); setPendingDeleteId(null); }}
        onConfirm={doDelete}
      />
    </View>
  );
}

function SubjectManagement() {
  const { subjects, deleteSubject, addSubject, users } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    name: string;
    teacherId: string;
    color: string;
  }>({
    name: '',
    teacherId: '',
    color: SUBJECT_COLORS[0],
  });

  const teachers = users.filter(u => u.role === 'teacher');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmVisible(true);
  };

  const doDelete = async () => {
    if (pendingDeleteId) await deleteSubject(pendingDeleteId);
    setPendingDeleteId(null);
    setConfirmVisible(false);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.teacherId) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const newSubject: Subject = {
      id: `s${Date.now()}`,
      name: formData.name,
      teacherId: formData.teacherId,
      color: formData.color,
    };

    await addSubject(newSubject);
    setModalVisible(false);
    setFormData({ name: '', teacherId: '', color: SUBJECT_COLORS[0] });
  };

  return (
    <View style={styles.managementContainer}>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {subjects.map((subject) => {
          const teacher = users.find(u => u.id === subject.teacherId);
          return (
            <View key={subject.id} style={styles.itemCard}>
              <View style={[styles.colorBar, { backgroundColor: subject.color }]} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{subject.name}</Text>
                <Text style={styles.itemSubtext}>{teacher?.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(subject.id)}
              >
                <Trash2 size={20} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#E67E22', '#D35400']} style={styles.fabGradient}>
          <Plus size={28} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Materia</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Nombre de la Materia</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ej: Matemáticas"
              />

              <Text style={styles.label}>Profesor</Text>
              <View style={styles.teacherList}>
                {teachers.map((teacher) => (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[
                      styles.teacherChip,
                      formData.teacherId === teacher.id && styles.teacherChipSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, teacherId: teacher.id })}
                  >
                    <Text
                      style={[
                        styles.teacherChipText,
                        formData.teacherId === teacher.id && styles.teacherChipTextSelected,
                      ]}
                    >
                      {teacher.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Color</Text>
              <View style={styles.colorPicker}>
                {SUBJECT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <LinearGradient colors={['#E67E22', '#D35400']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Agregar Materia</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar Materia"
        message="¿Estás seguro? Esto eliminará todas las clases asociadas."
        onCancel={() => { setConfirmVisible(false); setPendingDeleteId(null); }}
        onConfirm={doDelete}
      />
    </View>
  );
}

function UserManagement() {
  const { users, deleteUser, addUser } = useApp();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmVisible(true);
  };

  const doDelete = async () => {
    if (pendingDeleteId) await deleteUser(pendingDeleteId);
    setPendingDeleteId(null);
    setConfirmVisible(false);
  };

  const handleAdd = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return;
    }

    const newUser: User = {
      id: `u${Date.now()}`,
      name: formData.name,
      role: 'teacher',
    };

    await addUser(newUser);
    setModalVisible(false);
    setFormData({ name: '' });
  };

  const getRoleLabel = (role: UserRole) => {
    return role === 'teacher' ? 'Profesor' : 'Administrador';
  };

  return (
    <View style={styles.managementContainer}>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {users.map((user) => (
          <View key={user.id} style={styles.itemCard}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{user.name}</Text>
              <Text style={styles.itemSubtext}>
                {getRoleLabel(user.role)}
              </Text>
            </View>
            {user.role !== 'admin' && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(user.id)}
              >
                <Trash2 size={20} color="#E74C3C" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={['#E67E22', '#D35400']} style={styles.fabGradient}>
          <Plus size={28} color="#fff" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ej: Juan Pérez"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAdd}>
                <LinearGradient colors={['#E67E22', '#D35400']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>Agregar Usuario</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar Usuario"
        message="¿Estás seguro de eliminar este usuario?"
        onCancel={() => { setConfirmVisible(false); setPendingDeleteId(null); }}
        onConfirm={doDelete}
      />
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
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoutButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#2C3E50',
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  tabActive: {
    backgroundColor: '#E67E22',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#7F8C8D',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  managementContainer: {
    flex: 1,
  },
  daySelector: {
    maxHeight: 60,
  },
  daySelectorContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    minWidth: 90,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#E67E22',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#7F8C8D',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  colorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2C3E50',
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#2C3E50',
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  halfInput: {
    flex: 1,
  },
  timeSeparator: {
    fontSize: 18,
    color: '#7F8C8D',
    fontWeight: 'bold' as const,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    opacity: 0.7,
  },
  subjectChipSelected: {
    opacity: 1,
    borderWidth: 3,
    borderColor: '#2C3E50',
  },
  subjectChipText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  teacherList: {
    gap: 8,
  },
  teacherChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ECF0F1',
  },
  teacherChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4ECDC4',
  },
  teacherChipText: {
    color: '#7F8C8D',
    fontWeight: '600' as const,
    fontSize: 15,
  },
  teacherChipTextSelected: {
    color: '#2C3E50',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#2C3E50',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#ECF0F1',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4ECDC4',
  },
  roleOptionText: {
    color: '#7F8C8D',
    fontWeight: '600' as const,
    fontSize: 15,
  },
  roleOptionTextSelected: {
    color: '#2C3E50',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold' as const,
  },
  gradeSelector: {
    maxHeight: 60,
    marginTop: 8,
  },
  gradeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    minWidth: 64,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2C3E50',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  confirmCancel: {
    backgroundColor: '#F2F3F4',
  },
  confirmDelete: {
    backgroundColor: '#E74C3C',
  },
  confirmCancelText: {
    color: '#2C3E50',
    fontWeight: '600' as const,
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  syncButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  syncText: {
    color: '#2C3E50',
    fontWeight: '600' as const,
  },
});
