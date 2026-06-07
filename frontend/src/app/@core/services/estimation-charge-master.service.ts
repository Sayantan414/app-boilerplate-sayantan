import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class EstimationChargeMasterService {
  private http = inject(HttpClient);
  private loaderService = inject(LoaderService);
  private apiUrl = `${environment.apiUrl}/estimationchargemaster`;

  isLoading = signal(false);

  save(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/save`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  reset(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/reset`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  show(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/show`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
