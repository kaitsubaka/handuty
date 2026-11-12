import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Handuty: verification code',
      verificationEmailBody: (createCode: () => string) =>
        `Handuty: ${createCode()} is your verification code (es tu código de verificación).`,
    },
  },
});
