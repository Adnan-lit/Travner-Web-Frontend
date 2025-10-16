import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-travel-buddy-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './travel-buddy-create.component.html',
  styleUrls: ['./travel-buddy-create.component.css']
})
export class TravelBuddyCreateComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
}
