import { Hero } from './components/Hero'
import { Stats } from './components/Stats'
import { Fixtures } from './components/Fixtures'
import { Players } from './components/Players'
import { Footer } from './components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Stats />
      <Fixtures />
      <Players />
      <Footer />
    </div>
  )
}

export default App