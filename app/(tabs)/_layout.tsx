import { Tabs } from "expo-router";
import { Calendar, Settings, GraduationCap } from "lucide-react-native";
import React from "react";
import { useApp } from "@/contexts/AppContext";

export default function TabLayout() {
  const { currentUser } = useApp();

  if (currentUser?.role === 'admin') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#E67E22',
          headerShown: true,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#ECF0F1',
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="admin"
          options={{
            title: "Administración",
            tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    );
  }

  if (currentUser?.role === 'teacher') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#E67E22',
          headerShown: true,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#ECF0F1',
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Horarios",
            tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen name="admin" options={{ href: null }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E67E22',
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ECF0F1',
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mi Horario",
          tabBarIcon: ({ color }) => <GraduationCap color={color} size={24} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen name="admin" options={{ href: null }} />
    </Tabs>
  );
}
