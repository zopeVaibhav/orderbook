import { useEffect, useRef, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedRef,
    useAnimatedScrollHandler,
    useSharedValue,
    type SharedValue,
} from 'react-native-reanimated';
import { Spacing, useTheme } from '@/theme';

interface CollapsingScreenProps {
    header: ReactNode;
    tabs: ReactNode;
    children: ReactNode;
    contentKey?: string;
    refreshing?: boolean;
    onRefresh?: () => void;
    scrollY?: SharedValue<number>;
}

export function CollapsingScreen({
    header,
    tabs,
    children,
    contentKey,
    refreshing = false,
    onRefresh,
    scrollY,
}: CollapsingScreenProps) {
    const { colors } = useTheme();
    const scroll = useAnimatedRef<Animated.ScrollView>();
    const localY = useSharedValue(0);
    const offset = scrollY ?? localY;
    const headerHeight = useRef(0);

    const onScroll = useAnimatedScrollHandler((e) => {
        offset.set(e.contentOffset.y);
    });

    useEffect(() => {
        if (offset.get() > headerHeight.current) {
            scroll.current?.scrollTo({ y: headerHeight.current, animated: false });
        }
    }, [contentKey, offset, scroll]);

    return (
        <Animated.ScrollView
            ref={scroll}
            stickyHeaderIndices={[1]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
            contentContainerStyle={styles.container}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.mutedForeground}
                        progressBackgroundColor={colors.card}
                        colors={[colors.foreground]}
                    />
                ) : undefined
            }
        >
            <View
                onLayout={(e) => {
                    headerHeight.current = e.nativeEvent.layout.height;
                }}
            >
                {header}
            </View>
            {tabs}
            <View style={styles.content}>{children}</View>
        </Animated.ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
    content: { flexGrow: 1 },
});
