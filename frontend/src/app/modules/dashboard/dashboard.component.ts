import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ModalComponent, TableComponent],
  templateUrl: './dashboard.component.html',
  host: {
    class: 'flex flex-col flex-1 h-full min-h-0'
  }
})
export class DashboardComponent {
  isModalOpen = signal(false);

  columns: TableColumn[] = [
    { key: 'name', label: 'Project Name' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'date', label: 'Created At' }
  ];

  projects = [
    { name: 'Admin Dashboard', owner: 'Sayantan Sadhu', status: 'active', date: '2024-05-10' },
    { name: 'E-commerce App', owner: 'John Doe', status: 'pending', date: '2024-05-08' },
    { name: 'Portfolio Website', owner: 'Jane Smith', status: 'active', date: '2024-05-05' },
    { name: 'Mobile API', owner: 'Alex Johnson', status: 'inactive', date: '2024-05-01' }
  ];
}
