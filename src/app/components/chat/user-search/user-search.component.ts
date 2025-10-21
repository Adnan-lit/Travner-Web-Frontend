import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/common.model';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-search-container">
      <div class="search-header">
        <h3>New Message</h3>
        <button class="close-btn" (click)="onClose()">×</button>
      </div>
      
      <div class="search-input-container">
        <input 
          type="text" 
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          placeholder="Search users..."
          class="search-input">
      </div>
      
      <div class="search-results">
        <div *ngIf="isLoading" class="loading">
          <div class="spinner"></div>
          <span>Searching...</span>
        </div>
        
        <div *ngIf="!isLoading && searchResults.length === 0 && searchQuery" class="no-results">
          No users found matching "{{ searchQuery }}"
        </div>
        
        <div *ngIf="!isLoading && searchQuery && searchResults.length === 0" class="start-search">
          Type to search for users to chat with
        </div>
        
        <div class="user-list">
          <div 
            *ngFor="let user of searchResults" 
            class="user-item"
            (click)="selectUser(user)">
            
            <div class="user-avatar">
              <div class="avatar-placeholder">
                {{ getInitials(user.firstName, user.lastName) }}
              </div>
              <div class="online-indicator" [class.online]="user.isOnline"></div>
            </div>
            
            <div class="user-info">
              <div class="user-name">
                {{ user.firstName }} {{ user.lastName }}
              </div>
              <div class="user-username">
                {{ '@' + user.userName }}
              </div>
            </div>
            
            <div class="user-actions">
              <button class="chat-btn" (click)="selectUser(user)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-search-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: white;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }
    
    .search-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .search-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #212529;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-btn:hover {
      color: #212529;
    }
    
    .search-input-container {
      padding: 15px 20px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .search-input {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid #e9ecef;
      border-radius: 25px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .search-input:focus {
      border-color: #007bff;
    }
    
    .search-results {
      flex: 1;
      overflow-y: auto;
      padding: 10px 0;
    }
    
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6c757d;
      gap: 10px;
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .no-results, .start-search {
      text-align: center;
      padding: 40px 20px;
      color: #6c757d;
    }
    
    .user-list {
      padding: 0 20px;
    }
    
    .user-item {
      display: flex;
      align-items: center;
      padding: 15px 0;
      cursor: pointer;
      border-bottom: 1px solid #f8f9fa;
      transition: background-color 0.2s;
    }
    
    .user-item:hover {
      background: #f8f9fa;
    }
    
    .user-avatar {
      position: relative;
      margin-right: 15px;
    }
    
    .avatar-placeholder {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #007bff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 18px;
    }
    
    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #dc3545;
      border: 2px solid white;
    }
    
    .online-indicator.online {
      background: #28a745;
    }
    
    .user-info {
      flex: 1;
    }
    
    .user-name {
      font-size: 16px;
      font-weight: 600;
      color: #212529;
      margin-bottom: 2px;
    }
    
    .user-username {
      font-size: 14px;
      color: #6c757d;
    }
    
    .user-actions {
      margin-left: 10px;
    }
    
    .chat-btn {
      background: #007bff;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .chat-btn:hover {
      background: #0056b3;
    }
    
    @media (max-width: 768px) {
      .search-header {
        padding: 15px;
      }
      
      .search-input-container {
        padding: 10px 15px;
      }
      
      .user-list {
        padding: 0 15px;
      }
    }
  `]
})
export class UserSearchComponent implements OnInit, OnDestroy {
  @Output() userSelected = new EventEmitter<User>();
  @Output() closeSearch = new EventEmitter<void>();
  
  searchQuery = '';
  searchResults: User[] = [];
  isLoading = false;
  
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    // Setup search with debounce
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    // This will be called when searchQuery changes
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.isLoading = true;
    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching users:', error);
        this.searchResults = [];
        this.isLoading = false;
      }
    });
  }

  selectUser(user: User): void {
    // Emit event to parent component
    this.userSelected.emit(user);
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }

  onClose(): void {
    this.closeSearch.emit();
  }
}