import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mail-confirm',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './mail-confirm.html',
  styleUrl: '../login/login.component.css'
})
export class MailConfirm implements OnInit, OnDestroy {
  backgroundImages = [
    '/assets/images/vande1.jpg',
    '/assets/images/vande2.jpg',
    '/assets/images/vande3.jpg',
    '/assets/images/vande4.jpg',
    '/assets/images/vande5.jpg'
  ];
  currentBgIndex = signal(0);
  private intervalId: any;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.currentBgIndex.update(idx => (idx + 1) % this.backgroundImages.length);
    }, 10000); // 10 seconds
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
