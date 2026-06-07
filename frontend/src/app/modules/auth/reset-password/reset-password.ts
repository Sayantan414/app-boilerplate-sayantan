import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '../../../@core/services/user.service';

export const confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.parent || !control) return null;
  const password = control.parent.get('password');
  const passwordConfirm = control.parent.get('passwordConfirm');
  if (!password || !passwordConfirm) return null;
  if (passwordConfirm.value === '') return null;
  if (password.value === passwordConfirm.value) return null;
  return { passwordsNotMatching: true };
};

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.html',
  styleUrl: '../login/login.component.css',
})
export class ResetPassword implements OnInit, OnDestroy {
  resetPasswordForm!: FormGroup;
  user: any;
  resetting = false;
  passwordVisible = false;
  
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
    private _snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentBgIndex.update(idx => (idx + 1) % this.backgroundImages.length);
    }, 10000); // 10 seconds

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(4)]],
      passwordConfirm: ['', [Validators.required, confirmPasswordValidator]],
    });

    this.resetPasswordForm
      .get('password')
      ?.valueChanges.pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.resetPasswordForm.get('passwordConfirm')?.updateValueAndValidity();
      });
      
    const storedUser = sessionStorage.getItem('resetUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  resetPassword() {
    if (this.resetPasswordForm.invalid) return;
    this.resetting = true;
    let obj = JSON.parse(JSON.stringify(this.user));
    obj.onetime = false;
    obj.password = this.resetPasswordForm.get('password')?.value;
    
    this.userService
      .updatePassword(obj)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(
        (response: any) => {
          this.resetting = false;
          sessionStorage.removeItem('resetUser');
          this.router.navigate(['/dashboard']);
        },
        (respError: any) => {
          this._snackbar.open(respError.error?.message || 'Failed to update password', '', {
            duration: 2000,
            panelClass: 'error',
          });
          this.resetting = false;
        }
      );
  }
}
