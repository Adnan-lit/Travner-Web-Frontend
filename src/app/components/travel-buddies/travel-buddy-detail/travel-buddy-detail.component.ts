import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-travel-buddy-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './travel-buddy-detail.component.html',
  styleUrls: ['./travel-buddy-detail.component.css']
})
export class TravelBuddyDetailComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}