import { Component, signal, OnInit, computed, inject, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { TableColumn } from '../../shared/components/table/table.component';
import { ConfirmDialogService } from '../../@core/services/confirm-dialog.service';
import { RoleService, RoleData } from '../../@core/services/role.service';
import { AuthService } from '../../@core/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './roles.component.html',
  host: {
    class: 'flex flex-col flex-1 h-full min-h-0'
  }
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmDialogService);

  @ViewChild(FormGroupDirective) formRef!: FormGroupDirective;

  roles = signal<RoleData[]>([]);
  isLoading = this.roleService.isLoading;
  isAddModalOpen = signal(false);
  isEditMode = signal(false);
  isSubmitting = signal(false);
  originalRoleName = '';

  // Privileges state
  privilegesData = signal<any[]>([]);
  selectedFeature = signal<string>('');
  selectedPrivileges = signal<string[]>([]);
  dataLoaded = signal<boolean>(false);
  adminPrivileges: string[] = [
    'View Organization',
    'Add Organization',
    'Edit Organization',
    'Delete Organization',
    'App Dashboard'
  ];

  // Filters State
  searchQuery = signal('');
  filterStatus = signal('');
  appliedStatus = signal('');
  filterStartDate = signal('');
  filterEndDate = signal('');
  appliedStartDate = signal('');
  appliedEndDate = signal('');
  isFilterDrawerOpen = signal(false);

  roleForm!: FormGroup;

  currentUser = () => this.authService.currentUser();

  // Active Filter Count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.appliedStatus()) count++;
    if (this.appliedStartDate()) count++;
    if (this.appliedEndDate()) count++;
    return count;
  });

  // Filtered Roles (Local text filtering matching backend)
  filteredRoles = computed(() => {
    let list = this.roles();
    const query = this.searchQuery().trim().toLowerCase();

    if (query) {
      list = list.filter(role => role.name.toLowerCase().includes(query));
    }

    return list;
  });

  // Total selected privileges count
  privilegeCount = computed(() => this.selectedPrivileges().length);

  ngOnInit() {
    this.initForm();
    this.loadRoles();
    this.loadPrivileges();
  }

  initForm() {
    this.roleForm = this.fb.group({
      _id: [''],
      name: ['', [Validators.required, Validators.minLength(2)]],
      status: ['Active', [Validators.required]]
    });
  }

  loadPrivileges() {
    this.http.get<any[]>('/assets/jsons/privileges.json').subscribe({
      next: (data) => {
        this.privilegesData.set(data);
        if (data.length > 0) {
          this.selectedFeature.set(data[0].feature);
        }
        this.dataLoaded.set(true);
      },
      error: (err) => {
        console.error('Error loading privileges:', err);
      }
    });
  }

  loadRoles() {
    const criteria: any = {
      ocode: this.currentUser()?.ocode
    };
    const status = this.appliedStatus().trim();
    if (status) criteria.status = status;
    if (this.appliedStartDate()) criteria.startDate = this.appliedStartDate();
    if (this.appliedEndDate()) criteria.endDate = this.appliedEndDate();

    this.roleService.search(criteria).subscribe({
      next: (data) => {
        this.roles.set(data);
      }
    });
  }

  columns: TableColumn[] = [
    { key: 'name', label: 'Role Name' },
    {
      key: 'privilege',
      label: 'Privileges Count',
      getValue: (row) => {
        if (!row.privilege) return '0';
        if (Array.isArray(row.privilege)) return String(row.privilege.length);
        if (typeof row.privilege === 'string') {
          try {
            const parsed = JSON.parse(row.privilege);
            if (Array.isArray(parsed)) return String(parsed.length);
          } catch (e) {
            return String(row.privilege.split(',').map((p: any) => p.trim()).filter(Boolean).length);
          }
        }
        return '0';
      }
    },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actions: [
        {
          label: 'Edit Role',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
          type: 'edit'
        },
        {
          label: 'Delete Role',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
          type: 'delete'
        }
      ]
    }
  ];

  onSearchQueryChange(query: string) {
    this.searchQuery.set(query);
  }

  openFilterDrawer() {
    this.filterStatus.set(this.appliedStatus());
    this.filterStartDate.set(this.appliedStartDate());
    this.filterEndDate.set(this.appliedEndDate());
    this.isFilterDrawerOpen.set(true);
  }

  applyFilters() {
    this.appliedStatus.set(this.filterStatus());
    this.appliedStartDate.set(this.filterStartDate());
    this.appliedEndDate.set(this.filterEndDate());
    this.isFilterDrawerOpen.set(false);
    this.loadRoles();
  }

  resetFilters() {
    this.filterStatus.set('');
    this.appliedStatus.set('');
    this.filterStartDate.set('');
    this.appliedStartDate.set('');
    this.filterEndDate.set('');
    this.appliedEndDate.set('');
    this.isFilterDrawerOpen.set(false);
    this.loadRoles();
  }

  setFormMode(isEdit: boolean) {
    this.isEditMode.set(isEdit);
    const nameControl = this.roleForm.get('name');
    const statusControl = this.roleForm.get('status');

    if (isEdit) {
      nameControl?.enable();
      statusControl?.enable();
    } else {
      nameControl?.enable();
      statusControl?.setValue('Active');
    }
  }

  onFeatureChange(feature: string) {
    this.selectedFeature.set(feature);
  }

  getPrivilegesByFeature(): string[] {
    const activeFeature = this.selectedFeature();
    if (!activeFeature) return [];
    const featureObj = this.privilegesData().find(p => p.feature === activeFeature);
    // Filter out Admin privileges from custom selection, identical to reference implementation
    return featureObj && Array.isArray(featureObj.privilege)
      ? featureObj.privilege.filter((p: string) => !this.adminPrivileges.includes(p))
      : [];
  }

  onPrivilegeChange(privilege: string, checked: boolean) {
    const list = [...this.selectedPrivileges()];
    if (checked) {
      if (!list.includes(privilege)) {
        list.push(privilege);
      }
    } else {
      const index = list.indexOf(privilege);
      if (index > -1) {
        list.splice(index, 1);
      }
    }
    this.selectedPrivileges.set(list);
  }

  isPrivilegeSelected(privilege: string): boolean {
    return this.selectedPrivileges().includes(privilege);
  }

  areAllSelected(): boolean {
    const currentList = this.getPrivilegesByFeature();
    if (currentList.length === 0) return false;
    return currentList.every(p => this.isPrivilegeSelected(p));
  }

  areSomeSelected(): boolean {
    const currentList = this.getPrivilegesByFeature();
    if (currentList.length === 0) return false;
    const selectedCount = currentList.filter(p => this.isPrivilegeSelected(p)).length;
    return selectedCount > 0 && selectedCount < currentList.length;
  }

  toggleAllForFeature() {
    const currentList = this.getPrivilegesByFeature();
    const list = [...this.selectedPrivileges()];
    if (this.areAllSelected()) {
      // Deselect all
      currentList.forEach(p => {
        const index = list.indexOf(p);
        if (index > -1) {
          list.splice(index, 1);
        }
      });
    } else {
      // Select all
      currentList.forEach(p => {
        if (!list.includes(p)) {
          list.push(p);
        }
      });
    }
    this.selectedPrivileges.set(list);
  }

  getAllAvailablePrivileges(): string[] {
    let allPrivs: string[] = [];
    for (const featureObj of this.privilegesData()) {
      if (Array.isArray(featureObj.privilege)) {
        const filtered = featureObj.privilege.filter((p: string) => !this.adminPrivileges.includes(p));
        allPrivs = [...allPrivs, ...filtered];
      }
    }
    return [...new Set(allPrivs)];
  }

  areAllGlobalSelected(): boolean {
    if (!this.dataLoaded()) return false;
    const allAvailable = this.getAllAvailablePrivileges();
    if (allAvailable.length === 0) return false;
    return allAvailable.every(p => this.isPrivilegeSelected(p));
  }

  areSomeGlobalSelected(): boolean {
    if (!this.dataLoaded()) return false;
    const allAvailable = this.getAllAvailablePrivileges();
    if (allAvailable.length === 0) return false;
    const selectedCount = allAvailable.filter(p => this.isPrivilegeSelected(p)).length;
    return selectedCount > 0 && selectedCount < allAvailable.length;
  }

  toggleAllGlobal() {
    const allAvailable = this.getAllAvailablePrivileges();
    if (this.areAllGlobalSelected()) {
      // Deselect all
      this.selectedPrivileges.set([]);
    } else {
      // Select all
      this.selectedPrivileges.set(allAvailable);
    }
  }

  openAddModal() {
    this.setFormMode(false);
    this.selectedPrivileges.set([]);
    if (this.privilegesData().length > 0) {
      this.selectedFeature.set(this.privilegesData()[0].feature);
    }
    if (this.formRef) {
      this.formRef.resetForm({
        _id: '',
        name: '',
        status: 'Active'
      });
    } else {
      this.roleForm.reset({
        _id: '',
        name: '',
        status: 'Active'
      });
    }
    this.isAddModalOpen.set(true);
  }

  closeModal() {
    this.isAddModalOpen.set(false);
    this.isEditMode.set(false);
    if (this.formRef) {
      this.formRef.resetForm();
    } else {
      this.roleForm.reset();
    }
  }

  saveRole() {
    if (this.roleForm.invalid) {
      return;
    }
    if (this.isEditMode()) {
      this.updateRole();
    } else {
      this.addRole();
    }
  }

  addRole() {
    if (this.roleForm.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    const val = this.roleForm.value;
    const payload = {
      name: val.name.trim(),
      status: 'Active',
      privilege: this.selectedPrivileges(),
      ocode: this.currentUser()?.ocode
    };

    this.roleService.create(payload).subscribe({
      next: () => {
        this.loadRoles();
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
      }
    });
  }

  updateRole() {
    if (this.roleForm.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    const val = this.roleForm.value;
    const nameChanged = val.name.trim() !== this.originalRoleName;

    const payload: any = {
      _id: val._id,
      status: val.status,
      privilege: this.selectedPrivileges(),
      ocode: this.currentUser()?.ocode
    };

    if (nameChanged) {
      payload.name = val.name.trim();
    }

    this.roleService.update(payload).subscribe({
      next: () => {
        this.loadRoles();
        this.closeModal();
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
      }
    });
  }

  async handleAction(event: { type: string, row: any }) {
    if (event.type === 'delete') {
      const confirmed = await this.confirmService.confirm({
        title: 'Delete Role',
        message: `Are you sure you want to delete the role "${event.row.name}"? This action cannot be undone.`,
        confirmText: 'Delete Role',
        confirmColor: 'destructive'
      });

      if (confirmed) {
        this.roleService.delete(event.row._id, this.currentUser()?.ocode).subscribe({
          next: () => {
            this.loadRoles();
          }
        });
      }
    } else if (event.type === 'edit') {
      this.setFormMode(true);
      if (this.formRef) {
        this.formRef.resetForm();
      }

      this.originalRoleName = event.row.name || '';

      // Extract privileges
      let privs: string[] = [];
      if (event.row.privilege) {
        if (Array.isArray(event.row.privilege)) {
          privs = [...event.row.privilege];
        } else if (typeof event.row.privilege === 'string') {
          try {
            const parsed = JSON.parse(event.row.privilege);
            if (Array.isArray(parsed)) privs = parsed;
          } catch (e) {
            privs = event.row.privilege.split(',').map((p: string) => p.trim()).filter(Boolean);
          }
        }
      }
      this.selectedPrivileges.set(privs);

      // Select first active feature
      let foundFeature = '';
      if (privs.length > 0) {
        const firstPriv = privs[0];
        for (const featureObj of this.privilegesData()) {
          if (featureObj.privilege && featureObj.privilege.includes(firstPriv)) {
            foundFeature = featureObj.feature;
            break;
          }
        }
      }
      this.selectedFeature.set(foundFeature || (this.privilegesData().length > 0 ? this.privilegesData()[0].feature : ''));

      this.roleForm.patchValue({
        _id: event.row._id,
        name: event.row.name,
        status: event.row.status
      });
      this.isAddModalOpen.set(true);
    }
  }
}
