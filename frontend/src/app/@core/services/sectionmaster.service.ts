import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoaderService } from './loader.service';

export interface SectionData {
  _id?: string;
  section: string;
  ocode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SectionMasterService {
  private http = inject(HttpClient);
  private loaderService = inject(LoaderService);
  private apiUrl = `${environment.apiUrl}/sectionmaster`;

  isLoading = signal(false);

  public sectionList = new BehaviorSubject<SectionData[]>([]);
  public section = new BehaviorSubject<SectionData | undefined>(undefined);

  search(criteria: any = {}): Observable<SectionData[]> {
    this.isLoading.set(true);
    return this.http.post<SectionData[]>(`${this.apiUrl}/search`, criteria).pipe(
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

  show(id: string): Observable<SectionData> {
    this.isLoading.set(true);
    return this.http.get<SectionData>(`${this.apiUrl}/show/${id}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  removeItem(list: any) {
    let currentList = this.sectionList.value;
    let index = currentList.findIndex((item: any) => item._id === list._id);
    if (index > -1) {
      currentList.splice(index, 1);
      this.sectionList.next([...currentList]);
    }
  }
}
