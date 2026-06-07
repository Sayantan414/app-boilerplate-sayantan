import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserLogData {
  _id?: string;
  timestamp: string | Date;
  userid: string;
  ocode: string;
  type: string;
  collection: string;
  reference: string;
  message: string;
  apptype?: string;
  ipaddress?: string;
  firstname?: string;
  lastname?: string;
  image?: string;
  gender?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/userlog`;

  isLoading = signal(false);

  search(criteria: any = {}): Observable<UserLogData[]> {
    this.isLoading.set(true);
    return this.http.post<UserLogData[]>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  count(criteria: any = {}): Observable<number> {
    this.isLoading.set(true);
    return this.http.post<number>(`${this.apiUrl}/count`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
