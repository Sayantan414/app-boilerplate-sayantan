import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrimeProgressService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/primeprogress`;

  isLoading = signal(false);

  getProgressDone(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/getProgressDone`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
