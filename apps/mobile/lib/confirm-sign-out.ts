import { Alert } from 'react-native';
import { signOut } from './auth';

export function confirmSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in with Google again.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
}
