import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const responseBody = exception.getResponse();

    const normalizedBody =
      typeof responseBody === "string"
        ? { message: responseBody }
        : ((responseBody as Record<string, unknown> | undefined) ?? {});

    const rawMessage = normalizedBody.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join("; ")
      : typeof rawMessage === "string"
        ? rawMessage
        : "Request failed";

    response.status(status).json({
      success: false,
      status_code: status,
      error: (normalizedBody.error as string | undefined) ?? exception.name,
      message,
      details: Array.isArray(rawMessage) ? rawMessage : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
