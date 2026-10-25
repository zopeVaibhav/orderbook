import { Tabs } from 'expo-router';
import { Bell, ChartCandlestick, House } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabButton } from '@/components/ui/TabButton';
import { TabIcon } from '@/components/ui/TabIcon';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { Fonts, useTheme } from '@/theme';

export default function TabsLayout() {
    const { colors } = useTheme();
    const { bottom } = useSafeAreaInsets();
    const unread = useUnreadCount();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarButton: (props) => <TabButton {...props} />,
                animation: 'shift',
                sceneStyle: { backgroundColor: colors.background },
                tabBarActiveTintColor: colors.foreground,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 11 },
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    height: 64 + bottom,
                    paddingTop: 8,
                    paddingBottom: bottom + 6,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={House} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="markets"
                options={{
                    title: 'Markets',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={ChartCandlestick} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Activity',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon icon={Bell} color={color} focused={focused} />
                    ),
                    tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
                    tabBarBadgeStyle: { backgroundColor: colors.loss, fontSize: 10 },
                }}
            />
        </Tabs>
    );
}
