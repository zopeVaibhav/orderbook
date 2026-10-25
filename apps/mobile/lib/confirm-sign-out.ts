import { dialog } from '@/store/dialog';
import { signOut } from './auth';

export async function confirmSignOut() {
    const confirmed = await dialog.confirm({
        title: 'Sign out?',
        message: 'You will need to sign in with Google again.',
        confirmLabel: 'Sign out',
        destructive: true,
    });
    if (confirmed) await signOut();
}
