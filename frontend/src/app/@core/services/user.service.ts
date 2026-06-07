import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserData {
  _id?: string;
  mobile: string;
  email: string;
  firstname: string;
  lastname: string;
  password?: string;
  role: string;
  status: string;
  notificationid?: string[];
  empno?: string;
  addedby?: string;
  addedon?: string | Date;
  lastupdatedby?: string;
  lastupdatedon?: string | Date;
  ocode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/user`;

  isLoading = signal(false);

  search(criteria: any = {}): Observable<UserData[]> {
    this.isLoading.set(true);
    return this.http.post<UserData[]>(`${this.apiUrl}/search`, criteria).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  show(id: string): Observable<UserData> {
    this.isLoading.set(true);
    return this.http.get<UserData>(`${this.apiUrl}/show/${id}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  showUser(userid: string): Observable<UserData> {
    this.isLoading.set(true);
    return this.http.get<UserData>(`${this.apiUrl}/showUser/${userid}`).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  create(userData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/create`, userData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  update(userData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/update`, userData).pipe(
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

  updatePassword(passwordData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/updatePassword`, passwordData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  forgotPassword(passwordData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/forgotPassword`, passwordData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }

  resetPassword(passwordData: any): Observable<any> {
    this.isLoading.set(true);
    return this.http.post<any>(`${this.apiUrl}/resetPassword`, passwordData).pipe(
      finalize(() => this.isLoading.set(false))
    );
  }
}
