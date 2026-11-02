import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardHeight() {
    const [height, setHeight] = useState(() => Keyboard.metrics()?.height ?? 0);

    useEffect(() => {
        const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const subs = [
            Keyboard.addListener(show, (e) => setHeight(e.endCoordinates.height)),
            Keyboard.addListener(hide, () => setHeight(0)),
        ];
        return () => subs.forEach((s) => s.remove());
    }, []);

    return height;
}
