'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface StatItem {
  value: number
  label: string
  icon: React.ReactNode
}

const stats: StatItem[] = [
  {
    value: 150,
    label: 'Goals Scored',
    icon: (
      <svg className="w-10 h-10 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    value: 85,
    label: 'Assists',
    icon: (
      <svg className="w-10 h-10 text-neon-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    )
  },
  {
    value: 12,
    label: 'Clean Sheets',
    icon: (
      <svg className="w-10 h-10 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    value: 28,
    label: 'Matches Played',
    icon: (
      <svg className="w-10 h-10 text-neon-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
]

export function Stats() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    stats.forEach((stat) => {
      const element = section.querySelector(`[data-stat="${stat.label}"]`) as HTMLElement
      if (!element) return

      gsap.fromTo(element, 
        { textContent: 0 },
        {
          textContent: stat.value,
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      )
    })

    gsap.fromTo(section.querySelectorAll('.stat-card'),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      }
    )

    gsap.fromTo(section.querySelector('.section-title'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: section,
          start: 'top 85%'
        }
      }
    )
  }, [])

  return (
    <section id="stats" ref={sectionRef} className="section bg-navy-800/50 border-y border-neon-green/10">
      <div className="text-center mb-16">
        <h2 className="section-title">Stats &amp; Highlights</h2>
        <p className="section-subtitle mx-auto">Key performance metrics from the current season</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            data-stat={stat.label}
            className="stat-card card relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 via-transparent to-neon-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-navy-900/50 border border-neon-green/20 flex items-center justify-center group-hover:border-neon-green/50 group-hover:shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all duration-300">
                  {stat.icon}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neon-gold font-mono tabular-nums" style={{ fontFamily: "'Montserrat', monospace" }}>
                  0
                </div>
                <p className="mt-2 text-gray-400 font-medium text-lg">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}