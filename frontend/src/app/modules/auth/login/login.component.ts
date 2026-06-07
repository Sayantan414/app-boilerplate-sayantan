import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../@core/services/auth.service';
import { SnackbarService } from '../../../@core/services/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(SnackbarService);

  loginForm: FormGroup = this.fb.group({
    userid: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = signal(false);
  hidePassword = signal(true);

  backgroundImages = [
    '/assets/images/vande1.jpg',
    '/assets/images/vande2.jpg',
    '/assets/images/vande3.jpg',
    '/assets/images/vande4.jpg',
    '/assets/images/vande5.jpg'
  ];
  currentBgIndex = signal(0);
  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentBgIndex.update(idx => (idx + 1) % this.backgroundImages.length);
    }, 10000); // 10 seconds
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.onetime) {
          sessionStorage.setItem('resetUser', JSON.stringify(res));
          this.router.navigate(['/auth/reset-password']);
          this.snackBar.success('Please reset your temporary password.');
        } else {
          const user = this.authService.currentUser();
          if (user?.role === 'APPADMIN') {
            this.router.navigate(['/app-dashboard']);
          } else {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigate([returnUrl]);
          }
          this.snackBar.success('Welcome back!');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
      }
    });
  }
}
