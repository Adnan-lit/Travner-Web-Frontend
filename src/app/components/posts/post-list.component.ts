import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-post-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts: any[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private postService: PostService) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.postService.getPosts().subscribe({
      next: (response: any) => {
        this.posts = response.data || [];
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load posts. Please try again later.';
        this.isLoading = false;
        console.error('Error loading posts:', error);
      }
    });
  }
}