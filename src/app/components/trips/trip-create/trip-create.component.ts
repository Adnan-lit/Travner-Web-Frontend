import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trip-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-create.component.html',
  styleUrls: ['./trip-create.component.css']
})
export class TripCreateComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}