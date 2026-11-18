// app.config.js
// Everything is configured in app.json; this file only adds a safety check for store builds.
//
// EXPO_PUBLIC_API_URL is baked into the JavaScript bundle at build time, and src/services/api.ts
// falls back to a development address without it. An EAS "preview" or "production" build
// without an https API address would ship an app that cannot reach the server, so it stops here.
// EAS_BUILD_PROFILE is only set on the EAS build server; local development is not affected.
const RELEASE_PROFILES = ['preview', 'production'];

module.exports = ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

  if (RELEASE_PROFILES.includes(profile) && !/^https:\/\/[^/]+/.test(apiUrl)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL must be set to the https address of the API for the "${profile}" build ` +
        `(got "${apiUrl || 'nothing'}"). Add it as an EAS environment variable for this profile.`,
    );
  }

  return config;
};
