import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  showBottomNav = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Listen to route changes to show/hide bottom nav
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      // Hide bottom nav on login page
      this.showBottomNav = !url.startsWith('/login');
    });

    // Check initial auth state
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth && !this.router.url.startsWith('/login')) {
        this.router.navigate(['/login']);
      }
    });

    // Warm up backend on app start
    this.authService.warmupBackend().subscribe();
  }
}