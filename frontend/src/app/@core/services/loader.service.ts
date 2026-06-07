import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingCount = signal(0);
  
  // Computed signal to determine if loading is active
  isLoading = signal(false);

  show() {
    this.loadingCount.update(count => count + 1);
    this.isLoading.set(true);
  }

  hide() {
    this.loadingCount.update(count => {
      const next = Math.max(0, count - 1);
      if (next === 0) this.isLoading.set(false);
      return next;
    });
  }
}
