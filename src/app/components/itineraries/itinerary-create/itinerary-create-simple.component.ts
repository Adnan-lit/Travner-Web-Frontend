import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-itinerary-create-simple',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-blue-100 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold text-blue-800 mb-8">🧳 Create New Itinerary - Simple Test</h1>
        
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">Simple Test Component</h2>
          <p class="text-gray-600 mb-4">This is a simple test component to verify routing is working.</p>
          
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>✅ SUCCESS:</strong> If you can see this, the routing is working!
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter itinerary title">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter destination">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Enter description"></textarea>
            </div>
            
            <button class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              Create Itinerary
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ItineraryCreateSimpleComponent {
  constructor() {
    console.log('🧳 ItineraryCreateSimpleComponent loaded');
  }
}

