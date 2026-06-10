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
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(SnackbarService);

  loginForm: FormGroup = this.fb.group({
    userid: ['6296126935', [Validators.required]],
    password: ['123456', [Validators.required]]
  });

  isLoading = signal(false);
  hidePassword = signal(true);

  currentBgIndex = signal(0);

  ngOnInit() {

  }



  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.onetime) {
          sessionStorage.setItem('resetUser', JSON.stringify(res));
          this.router.navigate(['/auth/reset-password'], { replaceUrl: true });
          this.snackBar.success('Please reset your temporary password.');
        } else {
          const user = this.authService.currentUser();
          if (user?.role === 'APPADMIN') {
            this.router.navigate(['/app-dashboard'], { replaceUrl: true });
          } else {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigate([returnUrl], { replaceUrl: true });
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
