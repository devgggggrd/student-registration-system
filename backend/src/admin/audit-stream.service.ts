import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface AuditStreamMessage {
  data: {
    id: string;
    userId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
    createdAt: string;
    user?: {
      email?: string;
      role?: string;
      student?: { firstName: string; lastName: string } | null;
      teacher?: { firstName: string; lastName: string } | null;
    } | null;
  };
}

@Injectable()
export class AuditStreamService {
  private readonly stream$ = new Subject<AuditStreamMessage>();

  emit(log: AuditStreamMessage['data']) {
    this.stream$.next({ data: log });
  }

  getStream(): Observable<AuditStreamMessage> {
    return this.stream$.asObservable();
  }
}
