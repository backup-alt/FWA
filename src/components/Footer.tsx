'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    gsap.fromTo(footer.querySelectorAll('.footer-content > *'),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      }
    )

    const glowTimeline = gsap.timeline({ repeat: -1, yoyo: true })
    glowTimeline.to('.stadium-glow', {
      opacity: 0.6,
      duration: 2,
      ease: 'sine.inOut'
    }).to('.stadium-glow', {
      opacity: 1,
      duration: 2,
      ease: 'sine.inOut'
    })
  }, [])

  return (
    <footer ref={footerRef} className="relative bg-navy-900 pt-20 pb-10 overflow-hidden border-t border-neon-green/10">
      {/* Animated stadium silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-80 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-full stadium-glow transition-opacity"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ opacity: 1 }}
        >
          <defs>
            <linearGradient id="stadiumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a0a1a" />
              <stop offset="50%" stopColor="#00ff00" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#0a0a1a" />
            </linearGradient>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path 
            d="M0,320 L0,280 Q180,160 360,280 Q540,400 720,240 Q900,80 1080,260 Q1260,440 1440,280 L1440,320 Z" 
            fill="url(#stadiumGrad)" 
            filter="url(#glow-filter)"
          />
          <path 
            d="M0,320 L0,300 Q240,200 480,300 Q720,400 960,260 Q1200,120 1440,300 L1440,320 Z" 
            fill="rgba(0,255,0,0.05)" 
          />
          <path 
            d="M0,320 L0,310 Q360,260 720,310 Q1080,360 1440,310 L1440,320 Z" 
            fill="rgba(0,255,0,0.03)" 
          />
          <path 
            d="M0,320 L0,315 Q540,290 1080,315 Q1260,325 1440,315 L1440,320 Z" 
            fill="rgba(255,215,0,0.02)" 
          />
        </svg>
      </div>

      {/* Content */}
      <div className="footer-content relative z-10 section max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="text-3xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-neon-green to-neon-gold bg-clip-text text-transparent">FOOTBALL</span>
              <span className="text-white">3D</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Immersive football experience. Real-time stats, cinematic 3D, and cutting-edge web technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-neon-green font-bold mb-4 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Matches', 'Players', 'Stats', 'About'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-gray-400 hover:text-neon-green transition-colors duration-200 text-sm font-medium"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-neon-green font-bold mb-4 uppercase tracking-wider text-sm">Connect</h4>
            <div className="flex gap-3">
              {['twitter', 'instagram', 'youtube'].map((platform) => (
                <div
                  key={platform}
                  className="w-10 h-10 rounded-full bg-navy-800 border border-neon-green/20 flex items-center justify-center hover:border-neon-green hover:shadow-[0_0_15px_rgba(0,255,0,0.5)] transition-all duration-300 cursor-pointer group"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-neon-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12c2 0 4-1 5-2-2 3-5 4-8 3-3-1-5-2-6-4 2 0 6 0 9 3z" />
                  </svg>
                </div>
              ))}
            </div>
            <p className="mt-6 text-gray-500 text-sm">
              Contact us: <span className="text-neon-green">hello@football3d.com</span>
            </p>
          </div>
        </div>

        <div className="border-t border-neon-green/10 pt-8 text-center">
          <p className="text-gray-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} Football 3D. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}