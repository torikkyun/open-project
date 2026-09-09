import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

function normalizeResponseValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeResponseValue(item)) as T;
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    const decimal = value as { s?: unknown; e?: unknown; d?: unknown };
    if (
      typeof decimal.s === "number" &&
      typeof decimal.e === "number" &&
      Array.isArray(decimal.d)
    ) {
      return String(value) as T;
    }

    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, nestedValue]) => {
        const normalizedKey = toSnakeCase(key);
        acc[normalizedKey] = normalizeResponseValue(nestedValue as never);
        return acc;
      },
      {} as Record<string, unknown>,
    ) as T;
  }

  return value;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, T> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      map((response) => {
        if (response === null || response === undefined) {
          return response;
        }

        if (typeof response === "object") {
          const isAlreadyWrapped =
            Object.prototype.hasOwnProperty.call(response, "data") ||
            Object.prototype.hasOwnProperty.call(response, "meta") ||
            Object.prototype.hasOwnProperty.call(response, "message") ||
            Object.prototype.hasOwnProperty.call(response, "success");

          if (isAlreadyWrapped) {
            return normalizeResponseValue(response);
          }

          return normalizeResponseValue({ data: response });
        }

        return { data: response };
      }),
    );
  }
}
