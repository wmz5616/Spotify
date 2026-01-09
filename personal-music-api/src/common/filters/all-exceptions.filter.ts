import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = '系统繁忙，请稍后再试';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const errorResponse = response as { message: string | string[] };
        const msg = errorResponse.message;
        message = Array.isArray(msg) ? msg[0] : msg;
      } else if (typeof response === 'string') {
        message = response;
      }
    } else {
      this.logger.error('Unhandled System Exception:', exception);
    }

    const path = httpAdapter.getRequestUrl(ctx.getRequest()) as string;

    const responseBody = {
      code: httpStatus,
      message: message,
      timestamp: new Date().toISOString(),
      path: path,
    };
    // eslint-disable-next-line no-empty
    if (httpStatus >= 500) {
    } else {
      this.logger.warn(`Business Exception: ${httpStatus} - ${message}`);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
