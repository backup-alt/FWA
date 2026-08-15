import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutService, TabConfig } from '../../../core/services/layout.service';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: false
})
export class BottomNavComponent implements OnInit {
  tabs: TabConfig[] = [];
  activeTab: string = 'dashboard';

  constructor(
    private layoutService: LayoutService,
    private router: Router
  ) {}

  ngOnInit() {
    this.tabs = this.layoutService.tabs;
    this.layoutService.activeTab$.subscribe(tab => {
      this.activeTab = tab;
    });

    // Also check current route
    const currentRoute = this.router.url;
    for (const tab of this.tabs) {
      if (currentRoute.startsWith(tab.route)) {
        this.activeTab = tab.name;
        break;
      }
    }
  }

  onTabClick(tab: TabConfig) {
    this.layoutService.setActiveTab(tab.name);
    this.router.navigate([tab.route]);
  }
}
