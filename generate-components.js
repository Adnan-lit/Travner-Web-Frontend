const fs = require('fs');
const path = require('path');

const components = [
  'travel-buddies/travel-buddy-detail',
  'local-guides/local-guide-create',
  'local-guides/local-guide-detail',
  'trips/trip-create',
  'trips/trip-detail',
  'user/user-profile',
  'user/settings',
  'error/not-found'
];

components.forEach(comp => {
  const dir = path.join(__dirname, 'src', 'app', 'components', comp);
  const name = comp.split('/').pop();
  const className = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'Component';
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const tsContent = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-${name}',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './${name}.component.html',
  styleUrls: ['./${name}.component.css']
})
export class ${className} implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}`;

  const htmlContent = `<div class="container mx-auto p-4">
  <h2 class="text-2xl font-bold text-center mb-6">${name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
  <p class="text-center text-gray-600">This component is under development.</p>
</div>`;

  const cssContent = `/* ${name} Component Styles */
.container { max-width: 1200px; }`;

  fs.writeFileSync(path.join(dir, `${name}.component.ts`), tsContent);
  fs.writeFileSync(path.join(dir, `${name}.component.html`), htmlContent);
  fs.writeFileSync(path.join(dir, `${name}.component.css`), cssContent);
  
  console.log(`Created: ${comp}`);
});

console.log('All components created!');
