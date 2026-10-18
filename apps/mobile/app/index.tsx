import { Text, View } from 'react-native';
import { Side } from '@repo/types';

export default function Home() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text>Orderbook</Text>
            <Text>
                {Side.BID} / {Side.ASK}
            </Text>
        </View>
    );
}
