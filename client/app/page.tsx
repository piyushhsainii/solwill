import Navbar from '@/components/Landing/Navbar'
import Hero from '@/components/Landing/Hero'
import Problem from '@/components/Landing/Problem'
import HowItWorks from '@/components/Landing/HowItWorks'
import Features from '@/components/Landing/Features'
import CTA from '@/components/Landing/CTA'
import Footer from '@/components/Landing/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
