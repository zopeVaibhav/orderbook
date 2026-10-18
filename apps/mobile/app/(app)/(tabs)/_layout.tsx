import { Tabs } from 'expo-router';
import { Bell, ChartCandlestick, House, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { haptic } from '@/lib/haptics';
import { Fonts, useTheme } from '@/theme';

export default function TabsLayout() {
    const { colors } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const unread = useUnreadCount();

    return (
        <Tabs
            screenListeners={{ tabPress: () => haptic.tap() }}
            screenOptions={{
                headerShown: false,
                animation: 'shift',
                sceneStyle: { backgroundColor: colors.background },
                tabBarActiveTintColor: colors.foreground,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 11 },
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    height: 60 + bottom,
                    paddingTop: 6,
                    paddingBottom: bottom + 6,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <House size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="markets"
                options={{
                    title: 'Markets',
                    tabBarIcon: ({ color }) => <ChartCandlestick size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
                    tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
                    tabBarBadgeStyle: { backgroundColor: colors.loss, fontSize: 10 },
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <UserRound size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}
