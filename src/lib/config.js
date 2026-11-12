/**
 * Public sign-up switch. Closed by default: the deployed demo only admits accounts created
 * in Cognito by the owner (SPECS.md). Set VITE_SIGN_UP_OPEN=true at build time to reopen it,
 * together with `allowAdminCreateUserOnly: false` in amplify/backend.ts.
 */
export const signUpOpen = import.meta.env.VITE_SIGN_UP_OPEN === 'true';
