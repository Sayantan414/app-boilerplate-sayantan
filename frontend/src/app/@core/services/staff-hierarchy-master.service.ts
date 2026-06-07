import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StaffHierarchyMasterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/staffhierarchymaster`;

  isLoading = signal(false);

  public staffHierarchyMasterList = new BehaviorSubject<any[]>([]);
  public staffHierarchyMaster = new BehaviorSubject<any>(undefined);

  search(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  count(criteria: any = {}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/count`, criteria);
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
    return this.http.get<any>(`${this.apiUrl}/show/${id}`);
  }

  removeItem(list: any) {
    let currentList = this.staffHierarchyMasterList.value;
    let index = currentList.findIndex((item: any) => item._id === list._id);
    if (index > -1) {
      currentList.splice(index, 1);
      this.staffHierarchyMasterList.next([...currentList]);
    }
  }
}
