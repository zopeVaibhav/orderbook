import { useEffect, useRef, type ReactNode } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
    type ScrollViewInstance,
} from 'react-native';
import { Spacing, useTheme } from '@/theme';

interface CollapsingScreenProps {
    header: ReactNode;
    tabs: ReactNode;
    children: ReactNode;
    contentKey?: string;
    refreshing?: boolean;
    onRefresh?: () => void;
}

export function CollapsingScreen({
    header,
    tabs,
    children,
    contentKey,
    refreshing = false,
    onRefresh,
}: CollapsingScreenProps) {
    const { colors } = useTheme();
    const scroll = useRef<ScrollViewInstance>(null);
    const offset = useRef(0);
    const headerHeight = useRef(0);

    useEffect(() => {
        if (offset.current > headerHeight.current) {
            scroll.current?.scrollTo({ y: headerHeight.current, animated: false });
        }
    }, [contentKey]);

    return (
        <ScrollView
            ref={scroll}
            stickyHeaderIndices={[1]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
                offset.current = e.nativeEvent.contentOffset.y;
            }}
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, paddingBottom: Spacing['3xl'] },
    content: { flexGrow: 1 },
});
