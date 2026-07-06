import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { TrackerProvider } from './src/context/TrackerContext';
import YearWrappedGate from './src/components/YearWrappedGate';
import DashboardScreen from './src/screens/DashboardScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import { colors } from './src/theme/colors';
import MobilePreviewFrame from './src/components/MobilePreviewFrame';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function App() {
  return (
    <MobilePreviewFrame>
      <SafeAreaProvider>
        <TrackerProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                  paddingBottom: 4,
                  height: 56,
                  borderTopWidth: 2,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
              }}
            >
              <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                  title: '대시보드',
                  tabBarLabel: '대시보드',
                  tabBarIcon: ({ focused }) => <TabIcon emoji="🎀" focused={focused} />,
                }}
              />
              <Tab.Screen
                name="Statistics"
                component={StatisticsScreen}
                options={{
                  title: '통계',
                  tabBarLabel: '통계',
                  tabBarIcon: ({ focused }) => <TabIcon emoji="🌸" focused={focused} />,
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
          <YearWrappedGate />
        </TrackerProvider>
      </SafeAreaProvider>
    </MobilePreviewFrame>
  );
}
