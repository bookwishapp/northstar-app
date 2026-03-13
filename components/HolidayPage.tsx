'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CartButton from './CartButton';
import { useCart } from '@/context/CartContext';

interface Program {
  id: string;
  name: string;
  tier: string;
  deliveryTypes: string[];
  productTypes: string[];
  priceDigital: number | null;
  pricePhysical: number | null;
  description: string | null;
  features: string[];
  isActive: boolean;
  popular?: boolean;
}

interface Holiday {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  statusLabel: string;
  theme: string;
  character: string;
  characterDescription: string;
  programs: Program[];
}

interface HolidayPageProps {
  holiday: Holiday;
}

export default function HolidayPage({ holiday }: HolidayPageProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<{ [key: string]: 'digital' | 'physical' }>({});
  const { addItem } = useCart();

  useEffect(() => {
    setMounted(true);
    // Load images.js for base64 images
    const script = document.createElement('script');
    script.src = '/images.js';
    document.body.appendChild(script);
  }, []);

  if (!mounted) return null;

  const isActive = holiday.status === 'active' || holiday.status === 'always';

  return (
    <div className={holiday.theme}>
      {/* Navigation */}
      <nav>
        <Link href="/">
          <img src="/logo.png" className="nav-logo" alt="North Star Postal" />
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/holidays/easter">Easter</Link>
          <Link href="/holidays/christmas">Christmas</Link>
          <Link href="/holidays/halloween">Halloween</Link>
          <CartButton />
          <Link href="/track" className="cta">Track My Letter</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="holiday-hero">
        <div
          className="holiday-hero-bg"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('/images/${holiday.slug}-hero.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h1 style={{ fontSize: '3.5rem', fontFamily: 'Cinzel, serif', marginBottom: '1rem' }}>
            {holiday.name} Letters
          </h1>
          <p style={{ fontSize: '1.25rem', fontWeight: '300', maxWidth: '600px' }}>
            {holiday.description}
          </p>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', opacity: 0.9 }}>
            From {holiday.character}
          </p>
        </div>
      </section>

      {/* Two-Column Programs Section */}
      <section className="programs-section" style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="programs-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p className="section-label">Choose Your Package</p>
            <h2 className="section-title">Select a Program</h2>
            <span className="ornament">✢ &nbsp; ✢ &nbsp; ✢</span>
          </div>

          <div className="programs-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
            {/* Left Column - Program Cards */}
            <div className="programs-cards">
              {holiday.programs.map((program) => {
                const price = program.priceDigital
                  ? `$${(program.priceDigital / 100).toFixed(0)}`
                  : program.pricePhysical
                  ? `$${(program.pricePhysical / 100).toFixed(0)}`
                  : '$12';

                return (
                  <div
                    key={program.id}
                    className={`program-card ${program.popular ? 'popular' : ''} ${selectedProgram === program.id ? 'selected' : ''}`}
                    onClick={() => isActive && setSelectedProgram(program.id)}
                    style={{
                      border: '2px solid var(--accent)',
                      borderRadius: '8px',
                      padding: '2rem',
                      marginBottom: '1.5rem',
                      position: 'relative',
                      cursor: isActive ? 'pointer' : 'not-allowed',
                      opacity: isActive && program.isActive ? 1 : 0.6,
                      transition: 'all 0.3s ease',
                      background: selectedProgram === program.id ? 'var(--accent-glow)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {program.popular && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-12px',
                          right: '20px',
                          background: 'var(--accent)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                        }}
                      >
                        Most Popular
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{program.name}</h3>
                      <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>{price}</span>
                    </div>

                    {program.description && (
                      <p style={{ marginBottom: '1rem', color: 'var(--text-dim)', fontSize: '0.95rem' }}>
                        {program.description}
                      </p>
                    )}

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {program.features.map((feature, idx) => (
                        <li
                          key={idx}
                          style={{
                            padding: '0.5rem 0',
                            borderBottom: idx < program.features.length - 1 ? '1px solid rgba(201,168,76,0.2)' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isActive && program.isActive && (
                      <>
                        {program.deliveryTypes.length > 1 && (
                          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            {program.deliveryTypes.map((type) => (
                              <button
                                key={type}
                                style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  background: selectedDeliveryType[program.id] === type ? 'var(--accent)' : 'transparent',
                                  border: '1px solid var(--accent)',
                                  color: selectedDeliveryType[program.id] === type ? 'white' : 'var(--accent)',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  transition: 'all 0.2s',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDeliveryType({ ...selectedDeliveryType, [program.id]: type as 'digital' | 'physical' });
                                }}
                              >
                                {type === 'digital' ? 'Digital' : 'Physical'} - $
                                {type === 'digital'
                                  ? (program.priceDigital! / 100).toFixed(0)
                                  : (program.pricePhysical! / 100).toFixed(0)
                                }
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          className="cta"
                          style={{
                            width: '100%',
                            marginTop: '1rem',
                            background: 'var(--accent)',
                            border: '2px solid var(--accent)',
                            color: 'white',
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const deliveryType = program.deliveryTypes.length === 1
                              ? program.deliveryTypes[0] as 'digital' | 'physical'
                              : selectedDeliveryType[program.id] || program.deliveryTypes[0] as 'digital' | 'physical';

                            try {
                              await addItem(program.id, deliveryType);
                            } catch (error) {
                              console.error('Failed to add item to cart:', error);
                              alert('Failed to add item to cart. Please try again.');
                            }
                          }}
                        >
                          Add to Cart
                        </button>
                      </>
                    )}
                  </div>
                );
              })}

              {!isActive && (
                <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'var(--accent-glow)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>
                    {holiday.name} orders will open soon!
                  </p>
                  <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>
                    {holiday.statusLabel}
                  </p>
                  <button className="cta" style={{ marginTop: '1rem' }}>
                    Get Notified
                  </button>
                </div>
              )}

              {isActive && holiday.programs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--accent-glow)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>
                    Programs are being set up for {holiday.name}.
                  </p>
                  <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)' }}>
                    Check back soon!
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Character Image */}
            <div className="character-image-container">
              <div
                style={{
                  position: 'sticky',
                  top: '2rem',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                }}
              >
                {/* Placeholder for character image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    background: `linear-gradient(135deg, var(--accent), var(--accent-2))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{
                    fontSize: '2rem',
                    fontFamily: 'Cinzel, serif',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}>
                    {holiday.name}
                  </span>
                  <p style={{ marginTop: '1rem', fontSize: '1.25rem', color: 'white', fontFamily: 'Cinzel, serif' }}>
                    {holiday.character}
                  </p>
                  {holiday.characterDescription && (
                    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', padding: '0 1rem', textAlign: 'center' }}>
                      {holiday.characterDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Info Box */}
              <div
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'var(--accent-glow)',
                  borderRadius: '8px',
                  border: '1px solid var(--accent)',
                }}
              >
                <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>What's Included:</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                    Digital delivery within 24 hours
                  </li>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                    Completely personalized content
                  </li>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                    Beautiful holiday-themed design
                  </li>
                  <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                    High-quality PDF for printing
                  </li>
                  {holiday.programs.some(p => p.productTypes.includes('physical')) && (
                    <li style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: 'var(--accent)', marginRight: '0.5rem', fontWeight: 'bold' }}>•</span>
                      Physical mail option available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Letter Section */}
      <section className="sample-section" style={{ padding: '4rem 2rem', background: 'var(--accent-glow)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)' }}>
            See a Sample Letter
          </h3>
          <p style={{ marginBottom: '2rem', color: 'var(--text-dim)' }}>
            Every letter is unique, but here's what you can expect
          </p>
          <button className="cta">View Sample {holiday.name} Letter</button>
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