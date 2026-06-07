import { Component, signal, OnInit, computed, inject, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { TableColumn } from '../../shared/components/table/table.component';
import { FormFieldConfig } from '../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogService } from '../../@core/services/confirm-dialog.service';
import { UserService, UserData } from '../../@core/services/user.service';
import { AuthService } from '../../@core/services/auth.service';
import { RoleService } from '../../@core/services/role.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SharedModule, MatButtonModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private readonly confirmService = inject(ConfirmDialogService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly roleService = inject(RoleService);
  private readonly fb = inject(FormBuilder);

  @ViewChild(FormGroupDirective) formRef?: FormGroupDirective;

  currentUser = this.authService.currentUser;

  rolesList = signal<any[]>([]);

  formFields = computed<FormFieldConfig[]>(() => {
    const roles = this.rolesList().map(r => ({ label: r.name, value: r.name }));
    const isEdit = this.isEditMode();

    return [
      { key: 'firstname', label: 'First Name', type: 'text', placeholder: 'e.g. John' },
      { key: 'lastname', label: 'Last Name', type: 'text', placeholder: 'e.g. Doe' },
      { key: 'mobile', label: 'Mobile Number', type: 'tel', placeholder: 'e.g. 9876543210', maxlength: 10, filter: 'numeric' },
      { key: 'email', label: 'Email Address', type: 'email', placeholder: 'e.g. john@example.com' },
      { key: 'role', label: 'User Role', type: 'select', options: roles },
      ...(isEdit
        ? [
            {
              key: 'status',
              label: 'Account Status',
              type: 'select',
              options: [
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' }
              ]
            } as FormFieldConfig
          ]
        : [
            {
              key: 'password',
              label: 'Password',
              type: 'password',
              placeholder: 'Min 4 characters'
            } as FormFieldConfig
          ])
    ];
  });

  filterFormFields = computed<FormFieldConfig[]>(() => {
    const roles = this.rolesList().map(r => ({ label: r.name, value: r.name }));
    return [
      {
        key: 'role',
        label: 'User Role',
        type: 'select',
        colSpan: 2,
        options: [{ label: 'All Roles', value: '' }, ...roles]
      },
      {
        key: 'status',
        label: 'Account Status',
        type: 'select',
        colSpan: 2,
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' }
        ]
      }
    ];
  });

  isAddModalOpen = signal(false);
  isEditMode = signal(false);
  isLoading = this.userService.isLoading;
  searchQuery = signal('');
  users = signal<UserData[]>([]);
  hidePassword = signal(true);

  isFilterDrawerOpen = signal(false);

  // Draft filter states (bound to inputs inside the drawer)
  filterRole = signal('');
  filterStatus = signal('');

  // Applied filter states (used in computed filter)
  appliedRole = signal('');
  appliedStatus = signal('');

  // Count active advanced filters
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.appliedRole()) count++;
    if (this.appliedStatus()) count++;
    return count;
  });

  // Locally filtered list of users
  filteredUsers = computed(() => {
    const list = this.users();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter(user =>
      (user.firstname && user.firstname.toLowerCase().includes(query)) ||
      (user.lastname && user.lastname.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.mobile && user.mobile.toLowerCase().includes(query))
    );
  });

  onSearchQueryChange(query: string) {
    this.searchQuery.set(query);
  }

  openFilterDrawer() {
    this.filterForm.patchValue({
      role: this.appliedRole(),
      status: this.appliedStatus()
    });
    this.isFilterDrawerOpen.set(true);
  }

  applyFilters() {
    const val = this.filterForm.value;
    this.appliedRole.set(val.role || '');
    this.appliedStatus.set(val.status || '');
    this.isFilterDrawerOpen.set(false);
    this.loadUsers(); // Fetch users from server matching new filters
  }

  resetFilters() {
    this.filterForm.patchValue({
      role: '',
      status: ''
    });
    this.appliedRole.set('');
    this.appliedStatus.set('');
    this.isFilterDrawerOpen.set(false);
    this.loadUsers(); // Fetch all users from server
  }

  ngOnInit() {
    this.loadUsers();
    this.loadRolesList();
    console.log(this.currentUser());
  }

  loadRolesList() {
    this.roleService.search({ ocode: this.currentUser()?.ocode }).subscribe({
      next: (roles) => {
        this.rolesList.set(roles);
      },
      error: (err) => {
        console.error('Failed to load roles list for dropdown', err);
      }
    });
  }

  loadUsers() {
    const criteria: any = {
      ocode: this.currentUser()?.ocode
    };
    const role = this.appliedRole().trim();
    const status = this.appliedStatus().trim();

    if (role) criteria.role = role;
    if (status) criteria.status = status;

    this.userService.search(criteria).subscribe({
      next: (data) => {
        this.users.set(data);
      }
    });
  }

  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'user',
      getValue: (row: UserData) => [row.firstname, row.lastname].filter(Boolean).join(' ')
    },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actions: [
        // { label: 'View Details', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>', type: 'view' },
        { label: 'Edit User', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>', type: 'edit' },
        {
          label: 'Delete User',
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
          type: 'delete',
          show: (row: any) => row.status !== 'Active'
        }
      ]
    }
  ];

  userForm: FormGroup = this.fb.group({
    _id: [''],
    firstname: ['', [Validators.required]],
    lastname: [''],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', [Validators.required, Validators.email]],
    role: ['USER', [Validators.required]],
    status: ['Active', [Validators.required]],
    password: ['', [Validators.minLength(4)]]
  });

  filterForm: FormGroup = this.fb.group({
    role: [''],
    status: ['']
  });

  setFormMode(isEdit: boolean) {
    this.isEditMode.set(isEdit);
    const passwordControl = this.userForm.get('password');
    if (isEdit) {
      passwordControl?.clearValidators();
      passwordControl?.setValidators([Validators.minLength(4)]);
    } else {
      passwordControl?.setValidators([Validators.required, Validators.minLength(4)]);
    }
    passwordControl?.updateValueAndValidity();
  }

  openAddModal() {
    this.hidePassword.set(true);
    if (this.formRef) {
      this.formRef.resetForm({
        _id: '',
        firstname: '',
        lastname: '',
        mobile: '',
        email: '',
        role: 'USER',
        status: 'Active',
        password: ''
      });
    } else {
      this.userForm.reset({
        _id: '',
        firstname: '',
        lastname: '',
        mobile: '',
        email: '',
        role: 'USER',
        status: 'Active',
        password: ''
      });
    }
    this.setFormMode(false);
    this.isAddModalOpen.set(true);
  }

  closeModal() {
    this.isAddModalOpen.set(false);
    this.isEditMode.set(false);
    this.hidePassword.set(true);
    if (this.formRef) {
      this.formRef.resetForm();
    } else {
      this.userForm.reset();
    }
  }

  saveUser() {
    if (this.userForm.invalid) {
      return;
    }
    if (this.isEditMode()) {
      this.updateUser();
    } else {
      this.addUser();
    }
  }

  addUser() {
    if (this.userForm.invalid) {
      return;
    }
    const val = this.userForm.value;
    const payload = {
      firstname: val.firstname,
      lastname: val.lastname,
      mobile: val.mobile,
      email: val.email,
      role: val.role,
      status: 'Active', // Default status on creation
      password: val.password,
      ocode: this.currentUser()?.ocode
    };

    this.userService.create(payload).subscribe({
      next: (newUser) => {
        this.users.update(current => [...current, newUser]);
        this.closeModal();
      }
    });
  }

  updateUser() {
    if (this.userForm.invalid) {
      return;
    }
    const val = this.userForm.value;
    const payload = {
      _id: val._id,
      firstname: val.firstname,
      lastname: val.lastname,
      mobile: val.mobile,
      email: val.email,
      role: val.role,
      status: val.status,
      ocode: this.currentUser()?.ocode
    };

    this.userService.update(payload).subscribe({
      next: () => {
        this.users.update(current =>
          current.map(u => u._id === payload._id ? { ...u, ...payload } : u)
        );
        this.closeModal();
      }
    });
  }

  async handleAction(event: { type: string, row: any }) {
    if (event.type === 'delete') {
      const confirmed = await this.confirmService.confirm({
        title: 'Delete User',
        message: `Are you sure you want to delete ${event.row.firstname}? This action cannot be undone.`,
        confirmText: 'Delete User',
        confirmColor: 'destructive'
      });

      if (confirmed) {
        this.userService.delete(event.row._id, this.currentUser()?.ocode).subscribe({
          next: () => {
            this.users.update(current => current.filter(u => u._id !== event.row._id));
          }
        });
      }
    } else if (event.type === 'edit') {
      this.setFormMode(true);
      if (this.formRef) {
        this.formRef.resetForm();
      }
      this.userForm.patchValue({
        _id: event.row._id,
        firstname: event.row.firstname,
        lastname: event.row.lastname,
        mobile: event.row.mobile,
        email: event.row.email,
        role: event.row.role,
        status: event.row.status,
        password: ''
      });
      this.isAddModalOpen.set(true);
    }
  }
}
