// Analytics and Performance Monitoring for Phase 8
interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  type: 'navigation' | 'resource' | 'measure' | 'paint';
  timestamp: number;
}

class Analytics {
  private isEnabled: boolean;
  private userId: string | null = null;

  constructor() {
    this.isEnabled = !import.meta.env.DEV;
  }

  // Initialize analytics with user context
  init(userId: string) {
    this.userId = userId;
    this.trackEvent('user_session_start', 'engagement', 'login');
  }

  // Track custom events
  trackEvent(event: string, category: string, label?: string, value?: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('Analytics Event (DEV):', { event, category, label, value, metadata });
      return;
    }

    const eventData: AnalyticsEvent = {
      event,
      category,
      label,
      value,
      userId: this.userId ?? undefined,
      timestamp: Date.now(),
      metadata
    };

    // Send to analytics service (implement based on chosen provider)
    this.sendEvent(eventData);
  }

  // Track page views
  trackPageView(page: string, title?: string) {
    this.trackEvent('page_view', 'navigation', page, undefined, { title });
  }

  // Track errors
  trackError(error: Error, context?: string) {
    this.trackEvent('error', 'system', error.name, undefined, {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  // Track performance metrics
  trackPerformance() {
    if (!this.isEnabled || !window.performance) return;

    // Track Core Web Vitals
    this.trackCoreWebVitals();
    
    // Track navigation timing
    this.trackNavigationTiming();
    
    // Track resource loading
    this.trackResourceTiming();
  }

  // Track loyalty program specific events
  trackPointsEarned(points: number, action: string) {
    this.trackEvent('points_earned', 'loyalty', action, points);
  }

  trackRewardRedeemed(rewardId: string, pointsCost: number) {
    this.trackEvent('reward_redeemed', 'loyalty', rewardId, pointsCost);
  }

  trackAchievementUnlocked(achievementId: string) {
    this.trackEvent('achievement_unlocked', 'loyalty', achievementId);
  }

  trackSocialInteraction(action: string, targetUserId?: string) {
    this.trackEvent('social_interaction', 'social', action, undefined, { targetUserId });
  }

  trackCampaignParticipation(campaignId: string, action: 'enrolled' | 'completed' | 'abandoned') {
    this.trackEvent('campaign_participation', 'campaigns', action, undefined, { campaignId });
  }

  // Private methods
  private sendEvent(eventData: AnalyticsEvent) {
    // Batch events for efficiency
    const events = this.getStoredEvents();
    events.push(eventData);
    localStorage.setItem('analytics_events', JSON.stringify(events));

    // Send batch every 10 events or 30 seconds
    if (events.length >= 10) {
      this.flushEvents();
    } else {
      this.scheduleFlush();
    }
  }

  private getStoredEvents(): AnalyticsEvent[] {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch {
      return [];
    }
  }

  private async flushEvents() {
    const events = this.getStoredEvents();
    if (events.length === 0) return;

    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });

      // Clear stored events on successful send
      localStorage.removeItem('analytics_events');
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Events remain in storage for retry
    }
  }

  private scheduleFlush() {
    if ((window as any).analyticsFlushTimer) return;

    (window as any).analyticsFlushTimer = setTimeout(() => {
      this.flushEvents();
      (window as any).analyticsFlushTimer = null;
    }, 30000);
  }

  private trackCoreWebVitals() {
    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.trackEvent('core_web_vital', 'performance', 'LCP', entry.startTime);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          const fid = (entry as any).processingStart - entry.startTime;
          this.trackEvent('core_web_vital', 'performance', 'FID', fid);
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    new PerformanceObserver((list) => {
      let cls = 0;
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          cls += (entry as any).value;
        }
      }
      if (cls > 0) {
        this.trackEvent('core_web_vital', 'performance', 'CLS', cls);
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private trackNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics = {
      'Time to Interactive': navigation.domInteractive - navigation.fetchStart,
      'DOM Load': navigation.domContentLoadedEventEnd - navigation.fetchStart,
      'Page Load': navigation.loadEventEnd - navigation.fetchStart,
      'First Byte': navigation.responseStart - navigation.fetchStart
    };

    Object.entries(metrics).forEach(([name, value]) => {
      this.trackEvent('performance_timing', 'performance', name, value);
    });
  }

  private trackResourceTiming() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Track slow resources (>2s)
    resources.forEach(resource => {
      const loadTime = resource.responseEnd - resource.startTime;
      if (loadTime > 2000) {
        this.trackEvent('slow_resource', 'performance', resource.name, loadTime);
      }
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Auto-track performance on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => analytics.trackPerformance(), 1000);
  });
}