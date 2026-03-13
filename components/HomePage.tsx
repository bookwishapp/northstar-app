'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Holiday {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: 'active' | 'soon' | 'always' | 'inactive';
  statusLabel: string;
  theme: string;
  character: string;
  characterDescription: string;
}

interface HomePageProps {
  holidays: Holiday[];
  currentHoliday?: Holiday;
}

export default function HomePage({ holidays, currentHoliday }: HomePageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load images.js for base64 images
    const script = document.createElement('script');
    script.src = '/images.js';
    document.body.appendChild(script);
  }, []);

  if (!mounted) return null;

  // Use current holiday theme or default to easter
  const theme = currentHoliday?.theme || 'theme-easter';
  const heroHoliday = currentHoliday || holidays[0];

  return (
    <div className={theme}>
      {/* Navigation */}
      <nav>
        <img src="/logo.png" className="nav-logo" alt="North Star Postal" />
        <div className="nav-links">
          <Link href="/holidays/easter">Easter</Link>
          <Link href="/holidays/christmas">Christmas</Link>
          <Link href="/holidays/halloween">Halloween</Link>
          <Link href="#holidays">All Holidays</Link>
          <Link href="/track" className="cta">Track My Letter</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div
          className="hero-img"
          style={{
            backgroundImage: `url('/images/${heroHoliday.slug}-hero.jpg')`
          }}
        />
        <div className="hero-content">
          <img src="/logo-large.png" className="hero-logo" alt="North Star Postal" />
          <p className="hero-tagline">
            Personalized letters from magical characters,<br />
            written just for your child
          </p>
          <button
            className="hero-cta"
            onClick={() => document.getElementById('holidays')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore the Magic
          </button>
        </div>
        <div className="hero-scroll">
          <span>Discover</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="how-inner">
          <div className="how-header">
            <p className="section-label">The Process</p>
            <h2 className="section-title">How the Magic Happens</h2>
            <span className="ornament">✢ &nbsp; ✢ &nbsp; ✢</span>
          </div>
          <div className="steps">
            <div className="step">
              <img
                className="step-img portrait"
                src="/images/bunny-writing.jpg"
                alt="Character writing a letter"
              />
              <p className="step-num">Step One</p>
              <h3>A letter is written, just for your child</h3>
              <p>Tell us a little about them — their name, age, and what makes them special. Our characters craft every word with care.</p>
            </div>
            <div className="step">
              <img
                className="step-img"
                src="/images/letter-sealed.jpg"
                alt="Letter sealed with wax"
              />
              <p className="step-num">Step Two</p>
              <h3>Carefully prepared and sealed for delivery</h3>
              <p>Each letter is beautifully formatted and sealed — delivered digitally as a keepsake PDF, or sent as real physical mail.</p>
            </div>
            <div className="step">
              <img
                className="step-img"
                src="/images/celebration.jpg"
                alt="Celebrating the letter's arrival"
              />
              <p className="step-num">Step Three</p>
              <h3>It arrives like a dream</h3>
              <p>Watch their eyes light up as a letter addressed to them, from a character they believe in, lands in their hands.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Holiday Grid */}
      <section className="holidays-section" id="holidays">
        <div className="holidays-inner">
          <div className="holidays-header">
            <p className="section-label">From Our Characters</p>
            <h2 className="section-title">Choose Your Holiday</h2>
            <span className="ornament">✢ &nbsp; ✢ &nbsp; ✢</span>
            <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.5rem', fontSize: '1rem' }}>
              Eight characters. Countless memories.
            </p>
          </div>
          <div className="holidays-grid">
            {holidays.map((holiday) => (
              <div
                key={holiday.slug}
                className={`holiday-card ${holiday.status === 'soon' || holiday.status === 'inactive' ? 'inactive' : ''}`}
              >
                <span className={`card-badge ${
                  holiday.status === 'active' ? 'badge-active' :
                  holiday.status === 'always' ? 'badge-always' :
                  'badge-soon'
                }`}>
                  {holiday.statusLabel}
                </span>

                {/* Placeholder for holiday image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    background: `linear-gradient(135deg, #1a0a0a, #2d0f0f)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: '1.5rem',
                    color: 'rgba(201,168,76,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em'
                  }}>
                    {holiday.name}
                  </span>
                </div>

                <div className="holiday-card-body">
                  <p className="holiday-card-name">{holiday.name}</p>
                  <p className="holiday-card-desc">{holiday.description}</p>
                  {holiday.status === 'active' || holiday.status === 'always' ? (
                    <Link href={`/holidays/${holiday.slug}`} className="card-cta">
                      View Programs
                    </Link>
                  ) : (
                    <button className="card-cta">Notify Me When Open</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <img src="/logo.png" className="footer-logo" alt="North Star Postal" />
        <p>North Star Postal &bull; Magical Mail for Magical Children</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>
          northstarpostal.com &bull; Privacy &bull; Terms
        </p>
      </footer>
    </div>
  );
}