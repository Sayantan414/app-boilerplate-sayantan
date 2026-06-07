import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PrimeTargetData {
  _id?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class PrimeTargetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/primetarget`;

  isLoading = signal(false);

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

  delete(payload: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/delete`, payload).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  show(id: string): Observable<any> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.apiUrl}/show/${id}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  count(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/count`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  search(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  searchForList(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/searchForList`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  targetYears(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/targetYears`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  itemTypes(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/itemTypes`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  itemNames(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/itemNames`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  units(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/units`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  subItemNames(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/subItemNames`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  getTarget(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/getTarget`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
