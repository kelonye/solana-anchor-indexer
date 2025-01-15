export const noopLogger = {
  log: noopLoggerFn,
  debug: noopLoggerFn,
  warn: noopLoggerFn,
  error: noopLoggerFn,
};

function noopLoggerFn(..._args: any[]): void {}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
