import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { colors, fonts } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
        tabBarStyle: {
          backgroundColor: colors.navyDeep,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 86 : 66,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 10.5, letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Memories",
          tabBarIcon: ({ color, size }) => <Ionicons name="images" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alumni"
        options={{
          title: "Alumni",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
