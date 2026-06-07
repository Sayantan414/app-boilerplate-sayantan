import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface RoleData {
  _id?: string;
  name: string;
  privilege?: string[];
  status: string;
  ocode?: string;
  addedby?: string;
  addedon?: string | Date;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/role`;

  isLoading = signal(false);

  search(criteria: any = {}): Observable<RoleData[]> {
    this.isLoading.set(true);
    return this.http.post<RoleData[]>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  show(id: string): Observable<RoleData> {
    this.isLoading.set(true);
    return this.http.get<RoleData>(`${this.apiUrl}/show/${id}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  create(roleData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/create`, roleData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  update(roleData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/update`, roleData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  delete(id: string, ocode?: string): Observable<any> {
    this.isLoading.set(true);
    const payload: any = { _id: id };
    if (ocode) payload.ocode = ocode;
    return this.http.post<any>(`${this.apiUrl}/delete`, payload).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
