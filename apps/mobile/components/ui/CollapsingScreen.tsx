import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedRef,
    useAnimatedScrollHandler,
    useSharedValue,
    type SharedValue,
} from 'react-native-reanimated';
import { Spacing, useTheme } from '@/theme';

const BodyHeightContext = createContext(0);

export function useBodyHeight(): number {
    return useContext(BodyHeightContext);
}

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
    const [sizes, setSizes] = useState({ view: 0, header: 0, tabs: 0 });
    const bodyHeight = Math.max(0, sizes.view - sizes.header - sizes.tabs - Spacing['3xl']);
    const measure = (key: 'view' | 'header' | 'tabs', value: number) =>
        setSizes((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));

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
            onLayout={(e) => measure('view', e.nativeEvent.layout.height)}
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
                    measure('header', e.nativeEvent.layout.height);
                }}
            >
                {header}
            </View>
            <View onLayout={(e) => measure('tabs', e.nativeEvent.layout.height)}>{tabs}</View>
            <View style={styles.content}>
                <BodyHeightContext.Provider value={bodyHeight}>
                    {children}
                </BodyHeightContext.Provider>
            </View>
        </Animated.ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
    content: { flexGrow: 1 },
});
