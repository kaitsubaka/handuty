import { defineAuth } from '@aws-amplify/backend';
import { preTokenGeneration } from './pre-token-generation/resource';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Handuty: verification code',
      verificationEmailBody: (createCode: () => string) =>
        `Handuty: ${createCode()} is your verification code (es tu código de verificación).`,
    },
  },
  // Demo mode: no "forgot password"; the owner resets passwords (SPECS D13).
  accountRecovery: 'NONE',
  triggers: { preTokenGeneration },
});
