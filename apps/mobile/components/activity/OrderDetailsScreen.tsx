import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchX } from 'lucide-react-native';
import { OrderDetailsSection } from './OrderDetailsSection';
import { OrderHero } from './OrderHero';
import { OrderSummarySplit } from './OrderSummarySplit';
import { StatusTimeline } from './StatusTimeline';
import { BackHeader } from '@/components/ui/BackHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderDetailsPlaceholder } from '@/components/ui/Placeholders';
import { Screen } from '@/components/ui/Screen';
import { useOrderDetails } from '@/hooks/queries/useAccount';
import { Spacing, useTheme } from '@/theme';

export function OrderDetailsScreen({ clientOrderId }: { clientOrderId: string | undefined }) {
    const { colors } = useTheme();
    const details = useOrderDetails(clientOrderId);
    const { bottom } = useSafeAreaInsets();

    return (
        <Screen>
            <BackHeader title="Order details" />
            {details.isPending ? (
                <OrderDetailsPlaceholder />
            ) : details.data ? (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: bottom }}
                >
                    <OrderHero details={details.data} />
                    <OrderSummarySplit details={details.data} />
                    <StatusTimeline details={details.data} />
                    <OrderDetailsSection details={details.data} />
                </ScrollView>
            ) : (
                <View style={styles.empty}>
                    <EmptyState
                        icon={<SearchX size={28} color={colors.mutedForeground} />}
                        title={details.isError ? 'Order unavailable' : 'Order not found'}
                        message={
                            details.isError
                                ? 'Could not reach the server.'
                                : 'It may be older than your recent order history.'
                        }
                        actionLabel={details.isError ? 'Retry' : undefined}
                        onAction={details.isError ? details.refetch : undefined}
                    />
                </View>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    empty: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
});
