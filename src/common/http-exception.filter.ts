import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(e: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status =
      e instanceof HttpException
        ? e.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      e instanceof HttpException
        ? e.getResponse()
        : { message: "Internal server error" };
    res.status(status).json({
      statusCode: status,
      error: status === 500 ? "Internal server error" : body,
      timestamp: new Date().toISOString(),
    });
  }
}
