import { createContext, useContext, useState } from 'react';
import { Pressable } from 'react-native';
import type { BottomTabBarButtonProps } from 'expo-router/tabs';
import { haptic } from '@/lib/haptics';

const PressedContext = createContext(false);

export function useTabPressed(): boolean {
    return useContext(PressedContext);
}

export function TabButton({
    children,
    style,
    onPress,
    onLongPress,
    testID,
    role,
    'aria-label': ariaLabel,
    'aria-selected': ariaSelected,
}: BottomTabBarButtonProps) {
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            testID={testID}
            role={role}
            aria-label={ariaLabel}
            aria-selected={ariaSelected}
            style={style}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onPress={(e) => {
                haptic.tap();
                onPress?.(e);
            }}
            onLongPress={onLongPress}
        >
            <PressedContext.Provider value={pressed}>{children}</PressedContext.Provider>
        </Pressable>
    );
}
