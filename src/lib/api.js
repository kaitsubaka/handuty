const RULE_PREFIX = 'HANDUTY:';

const AUTH_ERRORS = {
  NotAuthorizedException: 'error.WRONG_CREDENTIALS',
  UserNotFoundException: 'error.WRONG_CREDENTIALS',
  UsernameExistsException: 'error.EMAIL_TAKEN',
  CodeMismatchException: 'error.WRONG_CODE',
  ExpiredCodeException: 'error.EXPIRED_CODE',
  InvalidPasswordException: 'VerPass',
  LimitExceededException: 'error.TOO_MANY_ATTEMPTS',
  TooManyRequestsException: 'error.TOO_MANY_ATTEMPTS',
  NetworkError: 'serverProblem',
};

export class ApiError extends Error {
  constructor(errors) {
    super(errors.map((error) => error.message).join('; '));
    this.name = 'ApiError';
    this.errors = errors;
  }
}

/** Data of a data client result, or throws when GraphQL returned errors. */
export function unwrap({ data, errors }) {
  if (errors?.length) {
    throw new ApiError(errors);
  }
  return data;
}

export async function run(request) {
  return unwrap(await request);
}

/** Message id (see `src/locales`) that explains `error` to the user. */
export function errorMessageId(error) {
  const messages =
    error instanceof ApiError ? error.errors.map((e) => e.message) : [error?.message];
  const rule = messages.find((message) => message?.startsWith(RULE_PREFIX));
  if (rule) {
    return `error.${rule.slice(RULE_PREFIX.length)}`;
  }
  if (error?.name && AUTH_ERRORS[error.name]) {
    return AUTH_ERRORS[error.name];
  }
  return globalThis.navigator?.onLine === false ? 'serverProblem' : 'SendError';
}
