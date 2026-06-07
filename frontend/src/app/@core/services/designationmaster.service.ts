import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';

export interface DesignationData {
  _id?: string;
  name: string;
  addedby?: string;
  lastupdatedby?: string;
  ocode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesignationMasterService {
  private http = inject(HttpClient);
  private loaderService = inject(LoaderService);
  private apiUrl = `${environment.apiUrl}/designationmaster`;

  isLoading = signal(false);

  public designationList = new BehaviorSubject<DesignationData[]>([]);
  public designation = new BehaviorSubject<DesignationData | undefined>(undefined);

  search(criteria: any = {}): Observable<DesignationData[]> {
    this.isLoading.set(true);
    return this.http.post<DesignationData[]>(`${this.apiUrl}/search`, criteria).pipe(
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

  show(id: string): Observable<DesignationData> {
    this.isLoading.set(true);
    return this.http.get<DesignationData>(`${this.apiUrl}/show/${id}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  removeItem(list: any) {
    const currentList = this.designationList.value;
    const index = currentList.findIndex((item: any) => item._id === list._id);
    if (index > -1) {
      currentList.splice(index, 1);
      this.designationList.next([...currentList]);
    }
  }
}
