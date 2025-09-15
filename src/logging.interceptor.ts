import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        console.log(`[SUCCESS] ${method} ${url} - ${Date.now() - now}ms`);
      }),
      catchError((err) => {
        console.error(
          `[ERROR] ${method} ${url} - ${Date.now() - now}ms\n`,
          err.message,
        );
        return throwError(() => err);
      }),
    );
  }
}
