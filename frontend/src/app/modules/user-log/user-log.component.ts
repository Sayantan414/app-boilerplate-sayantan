import { Component, signal, OnInit, computed, inject } from '@angular/core';

import { AuthService } from '../../@core/services/auth.service';
import { UserLogService, UserLogData } from '../../@core/services/user-log.service';
import { SharedModule } from '../../shared/shared.module';
import { TableColumn } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-user-log',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './user-log.component.html',
  host: {
    class: 'flex flex-col flex-1 h-full min-h-0'
  }
})
export class UserLogComponent implements OnInit {
  private readonly userLogService = inject(UserLogService);
  private readonly authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  isLoading = this.userLogService.isLoading;
  searchQuery = signal('');
  logs = signal<any[]>([]);

  isFilterDrawerOpen = signal(false);

  // Draft filter states (drawer inputs)
  filterAction = signal('');
  filterCollection = signal('');
  filterStartDate = signal('');
  filterEndDate = signal('');

  // Applied filter states
  appliedAction = signal('');
  appliedCollection = signal('');
  appliedStartDate = signal('');
  appliedEndDate = signal('');

  // Count active filters
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.appliedAction()) count++;
    if (this.appliedCollection()) count++;
    if (this.appliedStartDate() || this.appliedEndDate()) count++;
    return count;
  });

  // Signal array representation (Locally filtered logs)
  filteredLogs = computed(() => {
    const list = this.logs();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter(log =>
      (log.userid && log.userid.toLowerCase().includes(query)) ||
      (log.message && log.message.toLowerCase().includes(query)) ||
      (log.collection && log.collection.toLowerCase().includes(query)) ||
      (log.type && log.type.toLowerCase().includes(query))
    );
  });

  columns: TableColumn[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      getValue: (row: UserLogData) => {
        if (!row.timestamp) return '';
        const date = new Date(row.timestamp);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    },
    {
      key: 'user',
      label: 'User',
      getValue: (row: UserLogData) => {
        const name = [row.firstname, row.lastname].filter(Boolean).join(' ');
        return name || row.userid || 'System';
      }
    },
    {
      key: 'type',
      label: 'Action',
      type: 'badge'
    },
    {
      key: 'message',
      label: 'Details'
    },
    {
      key: 'ipaddress',
      label: 'IP Address'
    }
  ];

  ngOnInit() {
    this.loadLogs();
  }

  onSearchQueryChange(query: string) {
    this.searchQuery.set(query);
  }

  openFilterDrawer() {
    this.filterAction.set(this.appliedAction());
    this.filterCollection.set(this.appliedCollection());
    this.filterStartDate.set(this.appliedStartDate());
    this.filterEndDate.set(this.appliedEndDate());
    this.isFilterDrawerOpen.set(true);
  }

  applyFilters() {
    this.appliedAction.set(this.filterAction());
    this.appliedCollection.set(this.filterCollection());
    this.appliedStartDate.set(this.filterStartDate());
    this.appliedEndDate.set(this.filterEndDate());
    this.isFilterDrawerOpen.set(false);
    this.loadLogs();
  }

  resetFilters() {
    this.filterAction.set('');
    this.filterCollection.set('');
    this.filterStartDate.set('');
    this.filterEndDate.set('');

    this.appliedAction.set('');
    this.appliedCollection.set('');
    this.appliedStartDate.set('');
    this.appliedEndDate.set('');
    this.isFilterDrawerOpen.set(false);
    this.loadLogs();
  }

  loadLogs() {
    const criteria: any = {};
    const action = this.appliedAction().trim();
    const collectionName = this.appliedCollection().trim();
    const startDate = this.appliedStartDate();
    const endDate = this.appliedEndDate();

    // Tenant Isolation
    if (this.currentUser()?.ocode) {
      criteria.ocode = this.currentUser()?.ocode;
    }

    // Filters
    if (action) {
      criteria.type = action;
    }
    if (collectionName) {
      criteria.collection = collectionName;
    }
    if (startDate && endDate) {
      criteria.start = startDate;
      criteria.end = endDate;
    }

    this.userLogService.search(criteria).subscribe({
      next: (data) => {
        // Map avatars for high-fidelity rendering inside user column
        const enriched = data.map((log) => {
          let initials = 'U';
          if (log.firstname && log.lastname) {
            initials = (log.firstname.charAt(0) + log.lastname.charAt(0)).toUpperCase();
          } else if (log.userid) {
            initials = log.userid.substring(0, 2).toUpperCase();
          }
          return {
            ...log,
            avatar: initials
          };
        });

        this.logs.set(enriched);
      }
    });
  }
}
