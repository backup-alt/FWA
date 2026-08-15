import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type TabName = 'dashboard' | 'customers' | 'loans' | 'pending-dues' | 'reports';

export interface TabConfig {
  name: TabName;
  label: string;
  icon: string;
  iconFilled: string;
  route: string;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private activeTabSubject = new BehaviorSubject<TabName>('dashboard');
  public activeTab$ = this.activeTabSubject.asObservable();

  readonly tabs: TabConfig[] = [
    { name: 'dashboard', label: 'Dashboard', icon: 'home-outline', iconFilled: 'home', route: '/dashboard' },
    { name: 'customers', label: 'Customers', icon: 'people-outline', iconFilled: 'people', route: '/customers' },
    { name: 'pending-dues', label: 'Dues', icon: 'wallet-outline', iconFilled: 'wallet', route: '/pending-dues' },
    { name: 'reports', label: 'Reports', icon: 'analytics-outline', iconFilled: 'analytics', route: '/reports' }
  ];

  setActiveTab(tab: TabName): void {
    this.activeTabSubject.next(tab);
  }

  getActiveTab(): TabName {
    return this.activeTabSubject.value;
  }

  getTabConfig(tab: TabName): TabConfig | undefined {
    return this.tabs.find(t => t.name === tab);
  }
}
