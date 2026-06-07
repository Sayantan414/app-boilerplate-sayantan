import { Component, signal, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
import { LoaderService } from './@core/services/loader.service';
import { ConfirmDialogService } from './@core/services/confirm-dialog.service';
import { SnackbarService } from './@core/services/snackbar.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoaderComponent, ConfirmDialogComponent, SnackbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Boilerplate');
  protected readonly loaderService = inject(LoaderService);
  protected readonly confirmService = inject(ConfirmDialogService);
  protected readonly snackbarService = inject(SnackbarService);
  private readonly platformId = inject(PLATFORM_ID);

  private scrollListener!: (event: Event) => void;
  private onlineListener!: () => void;
  private offlineListener!: () => void;
  private offlineSnackbarId?: number;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const activeScrollTimeouts = new Map<HTMLElement, any>();

    this.scrollListener = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target || !target.classList) return;

      target.classList.add('is-scrolling');

      const existingTimeout = activeScrollTimeouts.get(target);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const newTimeout = setTimeout(() => {
        target.classList.remove('is-scrolling');
        activeScrollTimeouts.delete(target);
      }, 1000); // Fade out 1s after scroll stops

      activeScrollTimeouts.set(target, newTimeout);
    };

    this.onlineListener = () => {
      if (this.offlineSnackbarId !== undefined) {
        this.snackbarService.remove(this.offlineSnackbarId);
        this.offlineSnackbarId = undefined;
      }
      this.snackbarService.success('Internet connection restored.', 3000);
    };

    this.offlineListener = () => {
      this.offlineSnackbarId = this.snackbarService.error('Internet connection lost. Please check your network.', 0);
    };

    window.addEventListener('scroll', this.scrollListener, true);
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener, true);
      }
      if (this.onlineListener) {
        window.removeEventListener('online', this.onlineListener);
      }
      if (this.offlineListener) {
        window.removeEventListener('offline', this.offlineListener);
      }
    }
  }
}
