import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstimationStageMasterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/estimationstagemaster`;

  isLoading = signal(false);

  search(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  count(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/count`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  create(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/create`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  update(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/update`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  delete(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/delete`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  show(id: string): Observable<any> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.apiUrl}/show/${id}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  changePosition(data: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/changePosition`, data).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
