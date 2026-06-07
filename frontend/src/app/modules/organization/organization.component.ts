import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organization.component.html',
  host: {
    class: 'flex flex-col flex-1 h-full min-h-0'
  }
})
export class OrganizationComponent {
  
}
