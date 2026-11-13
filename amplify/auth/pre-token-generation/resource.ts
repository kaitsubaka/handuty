import { defineFunction } from '@aws-amplify/backend';

export const preTokenGeneration = defineFunction({
  name: 'pre-token-generation',
  entry: './handler.ts',
  runtime: 22,
  architecture: 'arm64',
  memoryMB: 128,
  timeoutSeconds: 3,
  // A user pool trigger belongs with the user pool: in another stack it is a circular dependency.
  resourceGroupName: 'auth',
});
