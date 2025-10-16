import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-local-guide-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './local-guide-create.component.html',
  styleUrls: ['./local-guide-create.component.css']
})
export class LocalGuideCreateComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}