import { useLocalSearchParams } from 'expo-router';
import { OrderDetailsScreen } from '@/components/activity/OrderDetailsScreen';

export default function OrderDetailsPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <OrderDetailsScreen clientOrderId={id} />;
}
