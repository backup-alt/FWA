'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Match {
  home: string
  away: string
  score: string
  time: string
  date: string
  competition: string
  live: boolean
  homeLogo: string
  awayLogo: string
}

const matches: Match[] = [
  { home: 'Real Madrid', away: 'Barcelona', score: '3 - 1', time: '21:00', date: 'Jun 22', competition: 'La Liga', live: false, homeLogo: '⚪', awayLogo: '🔵' },
  { home: 'Man City', away: 'Liverpool', score: '2 - 2', time: '19:30', date: 'Jun 23', competition: 'Premier League', live: false, homeLogo: '🔵', awayLogo: '🔴' },
  { home: 'Bayern', away: 'PSG', score: '1 - 0', time: '20:45', date: 'Jun 24', competition: 'UCL', live: false, homeLogo: '🔴', awayLogo: '🔵' },
  { home: 'Juventus', away: 'Inter Milan', score: '0 - 0', time: '18:00', date: 'Jun 25', competition: 'Serie A', live: true, homeLogo: '⚫', awayLogo: '⚫' },
]

export function Fixtures() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    gsap.fromTo(section.querySelector('.section-title'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: { trigger: section, start: 'top 85%' }
      }
    )

    gsap.fromTo(section.querySelector('.section-subtitle'),
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2,
        scrollTrigger: { trigger: section, start: 'top 85%' }
      }
    )

    gsap.fromTo(section.querySelectorAll('.match-card'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        scrollTrigger: { trigger: section, start: 'top 80%' }
      }
    )
  }, [])

  return (
    <section id="fixtures" ref={sectionRef} className="section relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-900/50 to-navy-900 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title">Fixtures &amp; Matches</h2>
          <p className="section-subtitle mx-auto">Upcoming and recent match results</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {matches.map((match, index) => (
            <div
              key={`${match.home}-${match.away}-${index}`}
              className="match-card card group cursor-pointer hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{match.competition}</span>
                {match.live && (
                  <span className="flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy-700 to-navy-800 border border-neon-green/30 flex items-center justify-center text-xl font-extrabold text-neon-green group-hover:border-neon-green/50 transition-all">
                    <span className="text-lg">{match.home.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-gray-300 font-medium text-center leading-tight">{match.home}</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-2xl md:text-3xl font-extrabold text-white font-mono tracking-wider mb-1">
                    {match.score}
                  </div>
                  <span className="text-xs text-gray-500">{match.time}</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy-700 to-navy-800 border border-neon-gold/30 flex items-center justify-center text-xl font-extrabold text-neon-gold group-hover:border-neon-gold/50 transition-all">
                    <span className="text-lg">{match.away.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-gray-300 font-medium text-center leading-tight">{match.away}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <span className="text-sm text-gray-500 bg-navy-900/50 px-4 py-1.5 rounded-full border border-neon-green/10">
                  {match.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <button className="btn-primary text-lg group">
            View All Matches
            <svg className="ml-2 w-5 h-5 inline-block transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}