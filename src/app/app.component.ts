import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthTestService } from './utils/auth-test.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Travner-Web-Frontend';

  constructor(private authTestService: AuthTestService) { }

  ngOnInit() {
    // Make test functions available globally for console debugging
    (window as any).testAuth = (username: string, password: string) =>
      this.authTestService.testAuthEndpoint(username, password);
    (window as any).testBackend = () =>
      this.authTestService.testBackendConnectivity();

    console.log('🔧 Debug functions available:');
    console.log('  - testAuth("username", "password") - Test authentication');
    console.log('  - testBackend() - Test backend connectivity');
  }
}
