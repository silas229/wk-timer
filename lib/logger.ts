import { randomUUID } from "node:crypto";
import pino, { Logger, LoggerOptions, TransportSingleOptions } from "pino";

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function buildTransport(): TransportSingleOptions | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  try {
    return pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: true,
        ignore: "pid,hostname",
      },
    });
  } catch {
    // pino-pretty is optional; fall back to JSON when unavailable
    return undefined;
  }
}

const baseOptions: LoggerOptions = {
  level,
  base: { service: "wk-timer", env: process.env.NODE_ENV },
  redact: {
    paths: ["password", "token", "headers.authorization"],
    remove: true,
  },
  transport: buildTransport(),
};

export const logger: Logger = pino(baseOptions);

export function withRequest(
  request: Request,
  context: Record<string, unknown> = {}
) {
  const reqId = request.headers.get("x-request-id") ?? randomUUID();

  const child = logger.child({
    reqId,
    ...context,
    req: {
      method: request.method,
      url: request.url,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
      ua: request.headers.get("user-agent") ?? undefined,
    },
  });

  return { log: child, reqId };
}

export function logError(
  log: Logger,
  error: unknown,
  message: string,
  context: Record<string, unknown> = {}
) {
  if (error instanceof Error) {
    log.error({ err: error, ...context }, message);
  } else {
    log.error({ error, ...context }, message);
  }
}
