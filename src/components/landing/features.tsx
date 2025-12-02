'use client';

import { useEffect, useRef, useState } from 'react';
import { Folder } from 'lucide-react';

const featuresLeft = [
  {
    title: 'Upload & Organize',
    description: 'Easily upload PDFs and documents, then organize them into templates for signing.',
  },
  {
    title: 'E-Signature Ready',
    description: 'Add signature fields, text boxes, and form elements to your documents with our intuitive editor.',
  },
];

const featuresRight = [
  {
    title: 'Send & Track',
    description: 'Send documents to recipients and track their progress in real-time.',
  },
  {
    title: 'Secure & Compliant',
    description: 'Bank-level encryption ensures your documents are safe and legally binding.',
  },
];

export function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.2, // Trigger when 20% of the cards are visible
        rootMargin: '0px',
      }
    );

    if (cardsRef.current) {
      observer.observe(cardsRef.current);
    }

    return () => {
      if (cardsRef.current) {
        observer.unobserve(cardsRef.current);
      }
    };
  }, []);

  return (
    <section
      id="features-section"
      className="relative w-full bg-white py-24 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 inline-block group cursor-default">
            Why GIS Docusign
            <div className="relative mx-auto w-32 mt-3">
              <div className="h-1.5 bg-gradient-to-r from-[#3b0764] via-[#6b21a8] to-[#3b0764] rounded-full shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/80 group-hover:scale-110 transition-all duration-300"></div>
            </div>
          </h2>
        </div>

        <div ref={cardsRef} className="grid gap-8 lg:grid-cols-[1fr_auto_1fr] items-center">

          {/* Left Column */}
          <div className="space-y-8">
            {featuresLeft.map((feature, index) => (
              <div
                key={index}
                className={`transform transition-all duration-1000 ease-out ${isVisible
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-20 opacity-0'
                  }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="rounded-2xl bg-gray-50 p-8 shadow-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="mb-3 text-xl font-bold" style={{ color: '#3b0764' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Center Column - Folder Shape */}
          <div
            className={`flex justify-center transform transition-all duration-1000 delay-300 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
              }`}
          >
            <div className="relative h-64 w-80">
              {/* Abstract Folder Shape using CSS/SVG - Glassy transparent */}
              <svg viewBox="0 0 320 256" className="w-full h-full drop-shadow-xl">
                <defs>
                  <linearGradient id="folder-center-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(229,231,235,0.6)" />
                    <stop offset="100%" stopColor="rgba(243,244,246,0.4)" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 40 A 20 20 0 0 1 40 20 L 120 20 L 150 50 L 300 50 A 20 20 0 0 1 320 70 L 320 236 A 20 20 0 0 1 300 256 L 20 256 A 20 20 0 0 1 0 236 L 0 60 A 20 20 0 0 1 20 40 Z"
                  fill="url(#folder-center-grad)"
                  stroke="rgba(209,213,219,0.5)"
                  strokeWidth="1.5"
                />
              </svg>
              <Folder className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 text-gray-300" />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {featuresRight.map((feature, index) => (
              <div
                key={index}
                className={`transform transition-all duration-1000 ease-out ${isVisible
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-20 opacity-0'
                  }`}
                style={{ transitionDelay: `${(index + 2) * 200}ms` }}
              >
                <div className="rounded-2xl bg-gray-50 p-8 shadow-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="mb-3 text-xl font-bold" style={{ color: '#3b0764' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
