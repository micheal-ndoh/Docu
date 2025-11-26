'use client';

import { Header } from './header';

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-white pb-20">
      <div className="relative mx-auto max-w-[1400px]">
        {/* SVG Background */}
        <div className="absolute inset-0 z-0">
          <svg
            viewBox="0 0 1400 700"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="folder-gradient"
                x1="0"
                y1="0"
                x2="1400"
                y2="700"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="20%" stopColor="#0f0520" /> {/* almost black purple */}
                <stop offset="50%" stopColor="#1e0836" /> {/* very dark purple */}
                <stop offset="100%" stopColor="#3b0764" /> {/* purple-900 */}
              </linearGradient>
            </defs>
            <path
              d="
                M 0 80
                A 40 40 0 0 1 40 40
                L 280 40
                Q 300 40 310 55
                L 350 140
                L 1360 140
                A 40 40 0 0 1 1400 180
                L 1400 660
                A 40 40 0 0 1 1360 700
                L 860 700
                Q 850 700 845 695
                Q 840 690 840 680
                L 840 630
                Q 840 620 835 615
                Q 830 610 820 610
                L 580 610
                Q 570 610 565 615
                Q 560 620 560 630
                L 560 680
                Q 560 690 555 695
                Q 550 700 540 700
                L 40 700
                A 40 40 0 0 1 0 660
                Z
              "
              fill="url(#folder-gradient)"
            />
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex min-h-[700px] flex-col pt-20">
          <Header />

          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center pb-32">
            <div className="max-w-4xl">
              <h1 className="mb-8 text-6xl font-bold tracking-tight text-white md:text-7xl leading-tight">
                Document signing
              </h1>
              <p className="mb-0 text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                From upload to e-signature, Docu provides a seamless and secure workflow for all your important documents. Get started in seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Document Icon Floating */}
        <div className="absolute bottom-[-70px] left-1/2 z-20 -translate-x-1/2 transform">
          <div className="relative h-52 w-40 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-700 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/20">
            {/* Folded corner */}
            <div className="absolute -top-0 -right-0 w-12 h-12 bg-gradient-to-br from-indigo-300 to-purple-400 rounded-bl-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-l-2 border-b-2 border-white/30 rounded-bl-2xl"></div>

            {/* Document lines */}
            <div className="mt-8 space-y-4">
              <div className="h-3 w-full rounded-full bg-white/50"></div>
              <div className="h-3 w-full rounded-full bg-white/50"></div>
              <div className="h-3 w-4/5 rounded-full bg-white/50"></div>
              <div className="h-3 w-full rounded-full bg-white/50"></div>
              <div className="h-3 w-3/4 rounded-full bg-white/50"></div>
              <div className="h-3 w-full rounded-full bg-white/50"></div>
              <div className="h-3 w-5/6 rounded-full bg-white/50"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
