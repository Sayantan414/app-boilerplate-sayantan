import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../../@core/services/user.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.css'
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  isModalOpen = false;
  userDetails: any;
  forgotPassword_userdetails: any;
  resetting = false;

  backgroundImages = [
    '/assets/images/vande1.jpg',
    '/assets/images/vande2.jpg',
    '/assets/images/vande3.jpg',
    '/assets/images/vande4.jpg',
    '/assets/images/vande5.jpg'
  ];
  currentBgIndex = signal(0);
  private intervalId: any;

  private _unsubscribeAll: Subject<any> = new Subject();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private _snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentBgIndex.update(idx => (idx + 1) % this.backgroundImages.length);
    }, 10000); // 10 seconds
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  verifyAccount() {
    if (this.forgotPasswordForm.invalid) return;

    let obj = this.forgotPasswordForm.value;
    this.userService
      .showUser(obj.email)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(
        (response: any) => {
          this.userDetails = response;
          this.forgotPassword_userdetails = JSON.parse(JSON.stringify(response));
          this.isModalOpen = true;
          this.cdr.detectChanges();
        },
        (respError: any) => {
          this._snackbar.open('This email id is not present', '', {
            duration: 2000,
            panelClass: 'error',
          });
          this.isModalOpen = false;
          this.cdr.detectChanges();
        }
      );
  }

  resetPassword() {
    this.resetting = true;
    this.userService
      .resetPassword(this.userDetails)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(
        (response: any) => {
          this.router.navigate(['/auth/mail-confirm']);
        },
        (respError: any) => {
          this._snackbar.open('Failed to reset password', '', {
            duration: 2000,
            panelClass: 'error',
          });
          this.resetting = false;
        }
      );
  }
}
