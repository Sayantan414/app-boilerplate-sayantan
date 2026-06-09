import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../@core/services/auth.service';
import { UserService } from '../../@core/services/user.service';
import { SnackbarService } from '../../@core/services/snackbar.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);

  currentUser = this.authService.currentUser;
  activeTab = signal<'details' | 'security'>('details');
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    console.log(this.currentUser());

  }

  private initForms() {
    const user = this.currentUser();
    console.log(user);

    // Profile details form (Disabled since it's read-only)
    this.profileForm = this.fb.group({
      firstname: [{ value: user?.firstname || '', disabled: true }, Validators.required],
      lastname: [{ value: user?.lastname || '', disabled: true }],
      mobile: [{ value: user?.mobile || '', disabled: true }, Validators.required],
      email: [{ value: user?.email || '', disabled: true }, [Validators.email]]
    });

    // Password update form
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { passwordMismatch: true };
  }

  fullName = () => {
    const user = this.currentUser();
    return user ? [user.firstname, user.lastname].filter(Boolean).join(' ') : 'Guest User';
  };

  initials = () => {
    const user = this.currentUser();
    if (!user) return 'GU';
    return (user.firstname[0] + (user.lastname?.[0] || '')).toUpperCase();
  };

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      this.snackbar.error('Please upload a valid image file.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.snackbar.error('Image size cannot exceed 2MB.');
      return;
    }

    this.uploadProfilePic(file);
  }

  private uploadProfilePic(file: File) {
    const user = this.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);

    this.userService.uploadProfilePic(user.id, file).subscribe({
      next: (res) => {
        // The backend returns successResponse with data containing image and imageUrl
        const rawUrl = res.data?.imageUrl || res.imageUrl;
        const profilePicUrl = rawUrl
          ? (rawUrl.startsWith('http') ? rawUrl : `${environment.apiUrl.replace('/api', '')}${rawUrl}`)
          : undefined;

        // Update local session signal
        const updatedUser: User = { ...user, profilePic: profilePicUrl };
        this.authService.currentUser.set(updatedUser);
        this.snackbar.success('Profile picture updated successfully!');
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Upload error', err);
        this.snackbar.error(err?.error?.message || 'Failed to upload profile picture.');
        this.isSubmitting.set(false);
      }
    });
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) return;

    const user = this.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);
    const payload = {
      _id: user.id,
      ocode: user.ocode,
      ...this.profileForm.value
    };

    this.userService.update(payload).subscribe({
      next: () => {
        // Update local session signal
        const updatedUser: User = {
          ...user,
          ...this.profileForm.value
        };
        this.authService.currentUser.set(updatedUser);
        this.snackbar.success('Profile details updated successfully!');
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Update error', err);
        this.snackbar.error(err?.error?.message || 'Failed to update profile details.');
        this.isSubmitting.set(false);
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;

    const user = this.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);
    const payload = {
      _id: (user as any)._id || user.id,
      ocode: user.ocode || '',
      password: this.passwordForm.value.password
    };

    this.userService.updatePassword(payload).subscribe({
      next: () => {
        this.snackbar.success('Password updated successfully!');
        this.passwordForm.reset();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        console.error('Password error', err);
        this.snackbar.error(err?.error?.message || 'Failed to change password.');
        this.isSubmitting.set(false);
      }
    });
  }
}