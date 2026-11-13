import { defineFunction } from '@aws-amplify/backend';

export const api = defineFunction({
  name: 'api',
  entry: './handler.ts',
  runtime: 22,
  architecture: 'arm64',
  memoryMB: 512,
  timeoutSeconds: 10,
  // The function is both a data resolver and a data client: grouping it with the data stack
  // avoids a circular dependency between the two nested stacks.
  resourceGroupName: 'data',
  logging: {
    format: 'json',
    level: 'info',
    retention: '1 week',
  },
});
