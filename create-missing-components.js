const fs = require('fs');
const path = require('path');

// List of missing components to create
const missingComponents = [
  'travel-buddies/travel-buddy-create',
  'travel-buddies/travel-buddy-detail',
  'local-guides/local-guide-create',
  'local-guides/local-guide-detail',
  'trips/trip-create',
  'trips/trip-detail',
  'user/user-profile',
  'user/settings',
  'error/not-found'
];

// Base component template
const componentTemplate = (name, className) => `import { Component, OnInit } from '@angular/core';
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

  ngOnInit(): void {
  }
}
`;

const htmlTemplate = (name) => `<div class="container mx-auto p-4">
  <h2 class="text-2xl font-bold text-center mb-6">${name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
  <p class="text-center text-gray-600">This component is under development.</p>
</div>
`;

const cssTemplate = `/* ${name} Component Styles */
.container {
  max-width: 1200px;
}
`;

// Create directories and files
missingComponents.forEach(componentPath => {
  const fullPath = path.join(__dirname, 'src', 'app', 'components', componentPath);
  const componentName = componentPath.split('/').pop();
  const className = componentName.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('') + 'Component';
  
  // Create directory
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  // Create component files
  const tsFile = path.join(fullPath, `${componentName}.component.ts`);
  const htmlFile = path.join(fullPath, `${componentName}.component.html`);
  const cssFile = path.join(fullPath, `${componentName}.component.css`);
  
  if (!fs.existsSync(tsFile)) {
    fs.writeFileSync(tsFile, componentTemplate(componentName, className));
  }
  
  if (!fs.existsSync(htmlFile)) {
    fs.writeFileSync(htmlFile, htmlTemplate(componentName));
  }
  
  if (!fs.existsSync(cssFile)) {
    fs.writeFileSync(cssFile, cssTemplate);
  }
  
  console.log(`Created component: ${componentPath}`);
});

console.log('All missing components created successfully!');
