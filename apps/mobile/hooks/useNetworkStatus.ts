import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
    isConnected: boolean;
    hasChanged: boolean;
}

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>({ isConnected: true, hasChanged: false });
    const previous = useRef<boolean | null>(null);

    useEffect(
        () =>
            NetInfo.addEventListener((state) => {
                const connected = state.isConnected !== false;
                if (previous.current === null) {
                    previous.current = connected;
                    setStatus({ isConnected: connected, hasChanged: !connected });
                    return;
                }
                if (connected === previous.current) return;
                previous.current = connected;
                setStatus({ isConnected: connected, hasChanged: true });
            }),
        [],
    );

    return status;
}
