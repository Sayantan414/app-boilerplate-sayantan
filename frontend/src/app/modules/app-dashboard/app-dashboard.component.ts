import { Component, signal, inject, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedModule } from '../../shared/shared.module';
import { TableColumn } from '../../shared/components/table/table.component';
import { OrganizationService } from '../../@core/services/organization.service';
import { AuthService } from '../../@core/services/auth.service';
import { ConfirmDialogService } from '../../@core/services/confirm-dialog.service';
import { SnackbarService } from '../../@core/services/snackbar.service';

@Component({
  selector: 'app-app-dashboard',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './app-dashboard.component.html',
  host: {
    class: 'flex flex-col flex-1 h-full min-h-0'
  }
})
export class AppDashboardComponent implements OnInit, OnDestroy {
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmDialogService);
  private snackbarService = inject(SnackbarService);

  private destroy$ = new Subject<void>();

  isDrawerOpen = signal(false);
  isAddModalOpen = signal(false);
  isFeatureModalOpen = signal(false);

  modalAction = 'add';
  orgForm: any = { ocode: '', oname: '', country: '', state: '', city: '' };

  orgList = signal<any[]>([]);
  countries: any[] = ['All'];
  states: any[] = ['All'];
  cities: any[] = ['All'];
  features: any[] = [];
  dashboard = { country: 'All', state: 'All', city: 'All', oname: '', ocode: '', status: 'Active' };

  columns: TableColumn[] = [
    { key: 'ocode', label: 'Code', type: 'button' },
    { key: 'oname', label: 'Name' },
    { key: 'country', label: 'Country' },
    { key: 'state', label: 'State' },
    { key: 'city', label: 'City' },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'addedon',
      label: 'Addedon',
      getValue: (row: any) => {
        if (!row.addedon) return '';
        const d = new Date(row.addedon);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    },
    {
      key: 'actions', label: 'Actions', type: 'actions', actions: [
        { label: 'Features Settings', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>', type: 'settings' },
        { label: 'Edit', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>', type: 'edit' },
        { label: 'Remove', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>', type: 'delete', show: (row: any) => row.status !== 'Removed' },
        { label: 'Active', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>', type: 'active', show: (row: any) => row.status !== 'Active' }
      ]
    }
  ];

  constructor() { }

  ngOnInit() {
    this.getData();
    if (isPlatformBrowser(this.platformId)) {
      this.getCountry();
      this.onFilter(); // Initial load
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getData() {
    this.organizationService.orgList
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        let orglist = JSON.parse(JSON.stringify(response));
        // Preserve selected state from organization service or current user
        const selectedOrg = this.organizationService.organization.value;
        const currentUser = this.authService.currentUser();
        const activeOcode = selectedOrg?.ocode || currentUser?.ocode;

        if (activeOcode) {
          orglist = orglist.map((org: any) => ({
            ...org,
            selected: org.ocode === activeOcode
          }));
        }
        this.orgList.set(orglist);
        setTimeout(() => this.cdr.detectChanges());
      });
  }

  getCountry() {
    this.organizationService.countries({})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          let data = JSON.parse(JSON.stringify(response));
          this.countries = ['All'];
          if (data.length > 0) {
            this.countries.push(...data);
          }
          if (!this.countries.includes(this.dashboard.country)) {
            this.dashboard.country = this.countries[0];
          }
          this.getState(this.dashboard.country);
          setTimeout(() => this.cdr.detectChanges());
        },
        error: (err) => console.error(err)
      });
  }

  getState(country: string) {
    this.states = ['All'];
    if (country !== 'All') {
      this.organizationService.states({ country })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            let data = JSON.parse(JSON.stringify(response));
            if (data.length > 0) {
              this.states.push(...data);
            }
            if (!this.states.includes(this.dashboard.state)) {
              this.dashboard.state = this.states[0];
            }
            this.getCity(country, this.dashboard.state);
            setTimeout(() => this.cdr.detectChanges());
          },
          error: (err) => console.error(err)
        });
    } else {
      if (!this.states.includes(this.dashboard.state)) {
        this.dashboard.state = this.states[0];
      }
      this.getCity(country, this.dashboard.state);
    }
  }

  getCity(country: string, state: string) {
    this.cities = ['All'];
    if (country !== 'All' && state !== 'All') {
      this.organizationService.cities({ country, state })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            let data = JSON.parse(JSON.stringify(response));
            if (data.length > 0) {
              this.cities.push(...data);
            }
            if (!this.cities.includes(this.dashboard.city)) {
              this.dashboard.city = this.cities[0];
            }
            setTimeout(() => this.cdr.detectChanges());
          },
          error: (err) => console.error(err)
        });
    } else {
      if (!this.cities.includes(this.dashboard.city)) {
        this.dashboard.city = this.cities[0];
      }
    }
  }

  onFilter() {
    let obj = JSON.parse(JSON.stringify(this.dashboard));
    for (const key in obj) {
      if (obj[key] === 'All' || obj[key] === ' ') delete obj[key];
    }

    this.organizationService.search(obj)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // APIs usually wrap arrays in a data property
          let orglist = JSON.parse(JSON.stringify(response?.data || response || []));
          this.organizationService.orgList.next(orglist);
          setTimeout(() => this.cdr.detectChanges());
          this.closeDrawer();
        },
        error: (err) => {
          console.error(err);
          this.closeDrawer();
        }
      });
  }

  toggleDrawer() {
    this.isDrawerOpen.set(!this.isDrawerOpen());
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  async handleAction(event: any) {
    const { type, row } = event;
    if (type === 'click_ocode') {
      this.selectOrganization(row);
    } else if (type === 'settings') {
      this.orgForm = { ...row };
      if (!this.orgForm.features) {
        this.orgForm.features = [];
      }
      this.organizationService.getFeatures().pipe(takeUntil(this.destroy$)).subscribe(response => {
        let data = JSON.parse(JSON.stringify(response));
        this.features = data.map((feat: any) => {
          let index = this.orgForm.features.indexOf(feat.name);
          if (index !== -1) {
            feat.checkFlag = true;
          } else if (feat.default) {
            feat.checkFlag = true;
            this.orgForm.features.push(feat.name);
          } else {
            feat.checkFlag = false;
          }
          return feat;
        });
        this.isFeatureModalOpen.set(true);
      });
    } else if (type === 'edit') {
      this.modalAction = 'edit';
      this.orgForm = { ...row };
      this.isAddModalOpen.set(true);
    } else if (type === 'delete') {
      const confirmed = await this.confirmService.confirm({
        title: 'Remove Organization',
        message: `Are you sure you want to remove ${row.oname}?`,
        confirmText: 'Remove',
        confirmColor: 'destructive'
      });

      if (confirmed) {
        this.organizationService.delete(row).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.organizationService.removeItem(row);
            this.onFilter();
          }
        });
      }
    } else if (type === 'active') {
      const confirmed = await this.confirmService.confirm({
        title: 'Activate Organization',
        message: `Are you sure you want to activate ${row.oname}?`,
        confirmText: 'Activate',
        confirmColor: 'primary'
      });

      if (confirmed) {
        const payload = { ...row, status: 'Active' };
        this.organizationService.update(payload).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.onFilter();
          }
        });
      }
    }
  }

  selectOrganization(row: any) {
    const currentList = this.orgList();
    const index = currentList.findIndex(org => org._id === row._id || org.ocode === row.ocode);
    if (index === -1) return;

    const isCurrentlySelected = currentList[index].selected;

    // Update the list with the selected state toggled, and all others unselected
    const updatedList = currentList.map((org, i) => ({
      ...org,
      selected: i === index ? !isCurrentlySelected : false
    }));

    this.orgList.set(updatedList);

    const isSelected = updatedList[index].selected;

    // Update current user context if selected, or clear it if unselected
    if (isSelected) {
      this.authService.currentUser.update(user => user ? { ...user, ocode: row.ocode, otype: row.otype } : null);
      this.organizationService.organization.next(row);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedOrg', JSON.stringify(row));
      }
    } else {
      this.authService.currentUser.update(user => {
        if (!user) return null;
        const { ocode, otype, ...rest } = user as any;
        return rest as any;
      });
      this.organizationService.organization.next(undefined);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('selectedOrg');
      }
    }

    this.snackbarService.success(`${row.oname} Has Been ${isSelected ? 'Selected' : 'Unselected'}.`);
  }

  openAddModal() {
    this.modalAction = 'add';
    this.orgForm = { ocode: '', oname: '', country: '', state: '', city: '' };
    this.isAddModalOpen.set(true);
  }

  closeModals() {
    this.isAddModalOpen.set(false);
    this.isFeatureModalOpen.set(false);
  }

  saveOrganization() {
    if (this.modalAction === 'add') {
      this.organizationService.getFeatures().pipe(takeUntil(this.destroy$)).subscribe(response => {
        let data = JSON.parse(JSON.stringify(response));
        this.orgForm.features = data.filter((feat: any) => feat.default).map((feat: any) => feat.name);

        this.organizationService.create(this.orgForm).pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.getCountry(); // Refresh filter options
            this.onFilter();
            this.closeModals();
          }
        });
      });
    } else {
      this.organizationService.update(this.orgForm).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.getCountry(); // Refresh filter options
          this.onFilter();
          this.closeModals();
        }
      });
    }
  }

  toggleFeature(feature: any) {
    if (feature.default) return;
    feature.checkFlag = !feature.checkFlag;
    let index = this.orgForm.features.indexOf(feature.name);
    if (feature.checkFlag && index === -1) {
      this.orgForm.features.push(feature.name);
    } else if (!feature.checkFlag && index !== -1) {
      this.orgForm.features.splice(index, 1);
    }
  }

  saveFeatures() {
    this.organizationService.update(this.orgForm).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.onFilter();
        this.closeModals();
      }
    });
  }
}
