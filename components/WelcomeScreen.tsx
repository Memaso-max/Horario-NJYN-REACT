import { useAllGradeGroups, useApp } from '@/contexts/AppContext';
import { User, UserRole } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BookOpen, GraduationCap, Shield } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const { users, login } = useApp();
  const allGradeGroups = useAllGradeGroups();
  const [selectedRole, setSelectedRole] = useState<UserRole | 'student' | null>(null);
  const router = useRouter();

  const handleRoleSelect = (role: UserRole | 'student') => {
    if (role === 'admin') {
      setAdminModalVisible(true);
      return;
    }
    setSelectedRole(role);
  };

  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminCredential, setAdminCredential] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminSubmit = async () => {
    const adminUser = users.find(u => u.role === 'admin');
    if (!adminUser) {
      setAdminError('Usuario admin no encontrado');
      return;
    }
    const DEFAULT_ADMIN_PASSWORD = 'V.27962617';
    if (adminCredential === DEFAULT_ADMIN_PASSWORD || ((adminUser as any).password && adminCredential === (adminUser as any).password)) {
      await login(adminUser);
      setAdminModalVisible(false);
      setAdminCredential('');
      router.replace('/(tabs)/admin');
    } else {
      setAdminError('Credencial incorrecta');
    }
  };

  const handleUserSelect = async (user: User) => {
    await login(user);
    if (user.role === 'admin') {
      router.replace('/(tabs)/admin');
    } else {
      router.replace('/(tabs)');
    }
  };

  const getRoleIcon = (role: UserRole | 'student') => {
    switch (role) {
      case 'student':
        return <GraduationCap size={48} color="#fff" strokeWidth={2} />;
      case 'teacher':
        return <BookOpen size={48} color="#fff" strokeWidth={2} />;
      case 'admin':
        return <Shield size={48} color="#fff" strokeWidth={2} />;
    }
  };

  const getRoleLabel = (role: UserRole | 'student') => {
    switch (role) {
      case 'student':
        return 'Estudiante';
      case 'teacher':
        return 'Profesor';
      case 'admin':
        return 'Administrador';
    }
  };

  const getRoleGradient = (role: UserRole | 'student'): [string, string] => {
    switch (role) {
      case 'student':
        return ['#667EEA', '#764BA2'];
      case 'teacher':
        return ['#4ECDC4', '#44A08D'];
      case 'admin':
        return ['#F2994A', '#F2C94C'];
    }
  };

  const filteredUsers = selectedRole && selectedRole !== 'student'
    ? users.filter(u => u.role === selectedRole)
    : [];

  if (selectedRole === 'student') {
    return (
      <LinearGradient
        colors={['#FFF5E6', '#FFE8CC', '#FFD9A6']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRole(null)}
          >
            <Text style={styles.backText}>← Atrás</Text>
          </TouchableOpacity>

          <Text style={styles.selectTitle}>Selecciona tu sección</Text>
          <Text style={styles.selectSubtitle}>Año y Sección</Text>

          <View style={styles.userList}>
            {allGradeGroups.map((gradeGroup) => (
              <TouchableOpacity
                key={gradeGroup}
                style={styles.userCard}
                onPress={async () => {
                  // create a lightweight student session so RootLayoutNav doesn't redirect
                  const studentUser = {
                    id: `student-${gradeGroup}`,
                    name: `${gradeGroup}° Sección`,
                    role: 'student' as const,
                  };
                  await login(studentUser);
                  router.replace('/(tabs)');
                }}
              >
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.userGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.userIconCircle}>
                    <GraduationCap size={48} color="#fff" strokeWidth={2} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{gradeGroup}° Grado</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (selectedRole) {
    return (
      <LinearGradient
        colors={['#FFF5E6', '#FFE8CC', '#FFD9A6']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRole(null)}
          >
            <Text style={styles.backText}>← Atrás</Text>
          </TouchableOpacity>

          <Text style={styles.selectTitle}>Selecciona tu usuario</Text>
          <Text style={styles.selectSubtitle}>{getRoleLabel(selectedRole)}</Text>

          <View style={styles.userList}>
            {filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => handleUserSelect(user)}
              >
                <LinearGradient
                  colors={getRoleGradient(selectedRole)}
                  style={styles.userGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.userIconCircle}>
                    {getRoleIcon(selectedRole)}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FFF5E6', '#FFE8CC', '#FFD9A6']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3geoes6d3qbb6wee77f00' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        {/* Admin credential modal */}
        <Modal visible={adminModalVisible} transparent animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.box}>
              <Text style={modalStyles.title}>Acceso Administrador</Text>
              <Text style={modalStyles.subtitle}>Introduce la credencial</Text>
              <TextInput
                style={modalStyles.input}
                value={adminCredential}
                onChangeText={(t) => { setAdminCredential(t); setAdminError(''); }}
                placeholder="Credencial"
                autoCapitalize="characters"
              />
              {adminError ? <Text style={modalStyles.error}>{adminError}</Text> : null}
              <View style={modalStyles.actions}>
                <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => { setAdminModalVisible(false); setAdminCredential(''); setAdminError(''); }}>
                  <Text style={modalStyles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.okBtn} onPress={handleAdminSubmit}>
                  <Text style={modalStyles.okText}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.welcomeTextContainer}>
          <Text style={styles.schoolName}>L.N ÁNGEL MÉNDEZ</Text>
          <Text style={styles.schoolSubtext}>Jayana Municipio Los Taques</Text>
          <Text style={styles.welcomeText}>Horarios Escolares</Text>
        </View>

        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>Selecciona tu rol</Text>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('student')}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleContent}>
                <GraduationCap size={56} color="#fff" strokeWidth={2.5} />
                <Text style={styles.roleText}>Estudiante</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('teacher')}
          >
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleContent}>
                <BookOpen size={56} color="#fff" strokeWidth={2.5} />
                <Text style={styles.roleText}>Profesor</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => handleRoleSelect('admin')}
          >
            <LinearGradient
              colors={['#F2994A', '#F2C94C']}
              style={styles.roleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.roleContent}>
                <Shield size={56} color="#fff" strokeWidth={2.5} />
                <Text style={styles.roleText}>Administrador</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 180,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  schoolName: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 4,
  },
  schoolSubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#E67E22',
    textAlign: 'center',
  },
  roleContainer: {
    gap: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  roleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  roleGradient: {
    padding: 24,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  roleText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  backButton: {
    marginBottom: 20,
  },
  backText: {
    fontSize: 18,
    color: '#E67E22',
    fontWeight: '600' as const,
  },
  selectTitle: {
    fontSize: 26,
    fontWeight: 'bold' as const,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
  },
  userList: {
    gap: 16,
  },
  userCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  userGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 4,
  },
  userGrade: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    marginBottom: 8,
  },
  error: {
    color: '#E74C3C',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F2F3F4',
    borderRadius: 8,
  },
  cancelText: {
    color: '#2C3E50',
    fontWeight: '600' as const,
  },
  okBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#E67E22',
    borderRadius: 8,
  },
  okText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
});
