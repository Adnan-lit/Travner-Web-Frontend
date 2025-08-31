import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { AdminUser } from '../../services/admin.service';

@Component({
    selector: 'app-user-test',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px;">
      <h2>User Test Component</h2>
      <button (click)="loadUsers()" style="margin-bottom: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">
        Load Users
      </button>
      <div *ngIf="loading">Loading users...</div>
      <div *ngIf="error" style="color: red;">Error: {{ error }}</div>
      <div *ngIf="users.length > 0">
        <h3>Users ({{ users.length }})</h3>
        <ul>
          <li *ngFor="let user of users">
            {{ user.userName }} - {{ user.firstName }} {{ user.lastName }} - {{ user.email }}
            <span *ngFor="let role of user.roles" style="margin-left: 10px; background: #e9ecef; padding: 2px 6px; border-radius: 4px;">
              {{ role }}
            </span>
          </li>
        </ul>
      </div>
      <div *ngIf="!loading && users.length === 0 && !error">
        No users found.
      </div>
    </div>
  `
})
export class UserTestComponent implements OnInit {
    users: AdminUser[] = [];
    loading = false;
    error: string | null = null;

    constructor(private adminService: AdminService) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;
        this.error = null;

        this.adminService.getAllUsers().subscribe({
            next: (users) => {
                this.users = users;
                this.loading = false;
                console.log('Users loaded:', users);
            },
            error: (error) => {
                this.error = error.message;
                this.loading = false;
                console.error('Error loading users:', error);
            }
        });
    }
}