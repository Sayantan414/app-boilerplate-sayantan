import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/organization`;
  
  public orgList = new BehaviorSubject<any[]>([]);
  public organization = new BehaviorSubject<any>(this.getInitialOrganization());

  isLoading = signal(false);

  private getInitialOrganization() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('selectedOrg');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch(e) {}
      }
    }
    return undefined;
  }

  clear() {
    this.organization.next(undefined);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('selectedOrg');
    }
  }

  search(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  countries(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/countries`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  states(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/states`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  cities(criteria: any = {}): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/cities`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  create(orgData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/create`, orgData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  update(orgData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/update`, orgData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  delete(orgData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/delete`, orgData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  remove(orgData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/remove`, orgData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
  
  removeItem(list: any) {
    let currentList = this.orgList.value;
    let index = currentList.findIndex((org: any) => org._id === list._id);
    if (index > -1) {
      currentList.splice(index, 1);
      this.orgList.next([...currentList]);
    }
  }

  getFeatures(): Observable<any> {
    return this.http.get('assets/jsons/features.json');
  }
}
