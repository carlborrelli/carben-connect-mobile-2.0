import 'dotenv/config';
import appJson from './app.json';

// Single source of truth for static config is app.json.
// This wrapper only injects dynamic, environment-derived values
// that cannot live in static JSON (e.g. the API URL from the env).
export default {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://www.carbenconnect.com',
    },
  },
};
