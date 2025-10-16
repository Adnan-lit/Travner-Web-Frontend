import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-local-guide-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './local-guide-detail.component.html',
  styleUrls: ['./local-guide-detail.component.css']
})
export class LocalGuideDetailComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}