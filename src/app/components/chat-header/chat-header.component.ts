/**
 * Enhanced Chat Header Component
 * Includes user search and conversation management
 */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatService } from '../../services/chat.service';
import { UserSearchService, UserSearchResult } from '../../services/user-search.service';
import { UserSearchComponent } from '../user-search/user-search.component';

@Component({
    selector: 'app-chat-header',
    standalone: true,
    imports: [CommonModule, RouterModule, UserSearchComponent],
    templateUrl: './chat-header.component.html',
    styleUrls: ['./chat-header.component.css']
})
export class ChatHeaderComponent implements OnInit, OnDestroy {
    private chatService = inject(ChatService);
    private userSearchService = inject(UserSearchService);

    showUserSearch = false;
    currentUser: UserSearchResult | null = null;

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.currentUser = this.userSearchService.getCurrentUser();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleUserSearch(): void {
        this.showUserSearch = !this.showUserSearch;
    }

    onUserSelected(user: UserSearchResult): void {
        this.showUserSearch = false;
        this.startConversationWithUser(user);
    }

    onSearchCancel(): void {
        this.showUserSearch = false;
    }

    private startConversationWithUser(user: UserSearchResult): void {
        // Use existing chat service to start direct conversation
        this.chatService.getOrCreateDirect(user.id).subscribe({
            next: (conversation) => {
                // Navigate to the conversation
                // This will be handled by the parent chat component
                console.log('Started conversation with', user.userName, conversation);
            },
            error: (error) => {
                console.error('Failed to start conversation:', error);
            }
        });
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }
}