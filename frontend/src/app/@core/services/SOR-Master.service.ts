import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class SORMasterService {
  private http = inject(HttpClient);
  private loaderService = inject(LoaderService);
  private apiUrl = `${environment.apiUrl}/sormaster`;

  isLoading = signal(false);

  public sorMasterList = new BehaviorSubject<any[]>([]);
  public sorMaster = new BehaviorSubject<any>(undefined);

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
}
