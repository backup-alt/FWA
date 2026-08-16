import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Keyboard } from '@capacitor/keyboard';
import type { PluginListenerHandle } from '@capacitor/core';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  showBottomNav = false;
  keyboardOpen = false;
  private keyboardListeners: PluginListenerHandle[] = [];

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

    void Keyboard.addListener('keyboardWillShow', () => { this.keyboardOpen = true; })
      .then(listener => this.keyboardListeners.push(listener));
    void Keyboard.addListener('keyboardWillHide', () => { this.keyboardOpen = false; })
      .then(listener => this.keyboardListeners.push(listener));
  }

  ngOnDestroy(): void {
    this.keyboardListeners.forEach(listener => void listener.remove());
  }
}
