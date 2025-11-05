import 'dotenv/config';

export default {
  expo: {
    name: 'Carben Connect',
    slug: 'carben-connect',
    scheme: 'carbenconnect',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.carbenconnect.mobile',
      buildNumber: '1',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'Camera is used to capture project photos.',
        NSPhotoLibraryAddUsageDescription: 'We save exported images to your photo library.',
        NSMicrophoneUsageDescription: 'Microphone is used for recording voice notes.',
      },
    },
    android: {
      package: 'com.carbenconnect.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      permissions: ['READ_MEDIA_IMAGES', 'RECORD_AUDIO', 'CAMERA'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    owner: 'carben-connect',
    extra: {
      eas: {
        projectId: 'f0319be5-6c87-4175-b795-15d014c8217d',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://www.carbenconnect.com',
    },
    experiments: {
      typedRoutes: false,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};
