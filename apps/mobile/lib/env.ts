import Constants from 'expo-constants';

function devServerApiUrl(): string {
    const host = Constants.expoConfig?.hostUri?.split(':')[0];
    return __DEV__ && host ? `http://${host}:${process.env.EXPO_PUBLIC_API_PORT || 8080}` : '';
}

export const ENV = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || devServerApiUrl(),
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
};
