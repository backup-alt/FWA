'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Player {
  name: string
  number: number
  position: string
  country: string
  stats: {
    speed: number
    shooting: number
    passing: number
    dribbling: number
  }
}

const players: Player[] = [
  {
    name: 'John Smith',
    number: 10,
    position: 'Striker',
    country: 'England',
    stats: { speed: 95, shooting: 92, passing: 85, dribbling: 90 }
  },
  {
    name: 'Alex Doe',
    number: 7,
    position: 'Midfielder',
    country: 'Brazil',
    stats: { speed: 85, shooting: 80, passing: 95, dribbling: 92 }
  },
  {
    name: 'Sam Lee',
    number: 9,
    position: 'Defender',
    country: 'Netherlands',
    stats: { speed: 78, shooting: 65, passing: 88, dribbling: 72 }
  },
  {
    name: 'Marco Rossi',
    number: 11,
    position: 'Winger',
    country: 'Italy',
    stats: { speed: 97, shooting: 85, passing: 82, dribbling: 95 }
  },
  {
    name: 'David Kim',
    number: 5,
    position: 'Center Back',
    country: 'South Korea',
    stats: { speed: 72, shooting: 55, passing: 82, dribbling: 60 }
  },
  {
    name: 'Lucas Silva',
    number: 8,
    position: 'Attacking Mid',
    country: 'Portugal',
    stats: { speed: 80, shooting: 88, passing: 93, dribbling: 91 }
  }
]

function PlayerCard({ player }: { player: Player; index?: number }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const statColors = (value: number) => {
    if (value >= 90) return 'text-neon-green'
    if (value >= 75) return 'text-neon-gold'
    return 'text-gray-400'
  }

  const statBars = (value: number) => {
    if (value >= 90) return 'bg-gradient-to-r from-neon-green to-neon-green/50'
    if (value >= 75) return 'bg-gradient-to-r from-neon-gold to-neon-gold/50'
    return 'bg-gradient-to-r from-gray-500 to-gray-700'
  }

  const positions = player.number.toString().padStart(2, '0')

  return (
    <div
      ref={cardRef}
      className="relative w-full"
      style={{ perspective: '1200px', height: '420px' }}
    >
      <div
        className="relative w-full h-full transition-all duration-700 ease-out cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden border border-neon-green/20"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-700 to-navy-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-neon-green/10 via-transparent to-transparent" />
          
          <div className="absolute top-4 right-4 text-6xl font-black text-neon-green/10 select-none">
            {positions}
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-green/20 to-neon-gold/20 border-2 border-neon-green/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,0,0.2)]">
              <span className="text-3xl font-black text-neon-green">
                {positions}
              </span>
            </div>
            
            <h3 className="text-xl font-extrabold text-white mb-1">{player.name}</h3>
            <p className="text-neon-green font-semibold text-sm mb-1">{player.position}</p>
            <p className="text-gray-400 text-sm mb-6">{player.country}</p>
            
            <div className="w-full px-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-medium">SPEED</span>
                <span className={`text-sm font-bold ${statColors(player.stats.speed)}`}>{player.stats.speed}</span>
              </div>
              <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${statBars(player.stats.speed)}`}
                  style={{ width: `${player.stats.speed}%` }}
                />
              </div>

              <div className="flex justify-between items-center mb-3 mt-4">
                <span className="text-xs text-gray-400 font-medium">SHOOTING</span>
                <span className={`text-sm font-bold ${statColors(player.stats.shooting)}`}>{player.stats.shooting}</span>
              </div>
              <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${statBars(player.stats.shooting)}`}
                  style={{ width: `${player.stats.shooting}%` }}
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-4 opacity-50">Click to flip</p>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden border border-neon-gold/20"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-navy-700 via-navy-900 to-navy-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-neon-gold/10 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4 text-6xl font-black text-neon-gold/10 select-none rotate-90">
            {positions}
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-gold/20 to-neon-green/20 border-2 border-neon-gold/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,215,0,0.2)]">
              <span className="text-3xl font-black text-neon-gold">
                {positions}
              </span>
            </div>
            
            <h3 className="text-xl font-extrabold text-white mb-4">{player.name}</h3>
            
            <div className="w-full px-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">PASSING</span>
                <span className={`text-sm font-bold ${statColors(player.stats.passing)}`}>{player.stats.passing}</span>
              </div>
              <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${statBars(player.stats.passing)}`}
                  style={{ width: `${player.stats.passing}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-400 font-medium">DRIBBLING</span>
                <span className={`text-sm font-bold ${statColors(player.stats.dribbling)}`}>{player.stats.dribbling}</span>
              </div>
              <div className="w-full h-2 bg-navy-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${statBars(player.stats.dribbling)}`}
                  style={{ width: `${player.stats.dribbling}%` }}
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-6 opacity-50">Click to flip back</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Players() {
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

    gsap.fromTo(section.querySelectorAll('.player-card-wrapper'),
      { opacity: 0, y: 50, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: { trigger: section, start: 'top 80%' }
      }
    )
  }, [])

  return (
    <section ref={sectionRef} className="section bg-navy-800/50 border-y border-neon-green/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><path fill=%22none%22 stroke=%22%2300ff00%22 stroke-width=%220.5%22 d=%22M20 5 L25 15 L35 15 L28 22 L31 32 L20 26 L9 32 L12 22 L5 15 L15 15 Z%22 opacity=%220.1%22/></svg>')] bg-repeat opacity-10" />

      <div className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title">Players</h2>
          <p className="section-subtitle mx-auto">Click cards to reveal player stats</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {players.map((player, index) => (
            <div key={`${player.name}-${index}`} className="player-card-wrapper">
              <PlayerCard player={player} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}