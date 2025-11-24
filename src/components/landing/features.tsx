'use client';

import { useEffect, useRef, useState } from 'react';
import { Folder } from 'lucide-react';

const features = [
  {
    title: 'Effortless Navigation',
    description: 'Streamlined design makes creating documents effortless.',
  },
  {
    title: 'Engaging Experience',
    description:
      'Engage with dynamic and intuitive questionnaires for precise results.',
  },
  {
    title: 'Professional Quality',
    description:
      'Delivering professional-grade documents, tailored for success.',
  },
  {
    title: 'Seamless Accessibility',
    description: 'Access your projects anytime, anywhere, on any device.',
  },
];

export function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={featuresRef}
      className={`py-20 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container relative mx-auto px-4 md:px-6">
        <Folder className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 text-white/5" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg bg-white/5 p-6 shadow-lg backdrop-blur-sm"
            >
              <h3 className="mb-2 text-xl font-bold text-orange-400">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
