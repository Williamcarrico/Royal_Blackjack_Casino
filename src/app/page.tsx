"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ChevronRight, Crown, DollarSign, Zap } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      title: "Premium Experience",
      description: "Indulge in the most realistic digital blackjack experience with stunning graphics and animations.",
      icon: <Crown className="w-10 h-10 text-yellow-500" />,
    },
    {
      title: "Practice Mode",
      description: "Refine your skills in our risk-free practice environment before hitting the high-stakes tables.",
      icon: <Zap className="w-10 h-10 text-purple-500" />,
    },
    {
      title: "Big Wins",
      description: "Experience the thrill of winning with generous payouts and exciting bonus opportunities.",
      icon: <DollarSign className="w-10 h-10 text-green-500" />,
    },
  ];

  const testimonials = [
    {
      quote: "The most realistic blackjack experience I've found online. Just like being in Vegas!",
      author: "James M.",
    },
    {
      quote: "Amazing graphics and smooth gameplay. I'm completely addicted!",
      author: "Sarah T.",
    },
    {
      quote: "The practice mode helped me improve my strategy significantly. Highly recommended!",
      author: "Michael R.",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden text-white bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center h-screen overflow-hidden">
        {/* Enhanced 3D floating cards background */}
        <div className="absolute inset-0">
          {/* Depth layers for realistic 3D effect */}
          {[0.6, 0.75, 0.9].map((depth) => (
            <div key={`depth-layer-${depth.toString().replace('.', '-')}`} className="absolute inset-0">
              {['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'].map((cardId) => {
                // Randomize various card properties
                const cardType = ['red', 'blue', 'abstract', 'red2', 'blue2', 'castle'][Math.floor(Math.random() * 6)];
                const initialRotateX = Math.random() * 40 - 20;
                const initialRotateY = Math.random() * 40 - 20;
                const initialRotateZ = Math.random() * 60 - 30;

                // Get depth index safely
                function getDepthIndex(depth: number): number {
                  if (depth === 0.6) return 0;
                  if (depth === 0.75) return 1;
                  return 2; // default for 0.9
                }

                const depthIndex = getDepthIndex(depth);
                const driftRange = 120 - (depthIndex * 30); // Less drift for deeper cards

                return (
                  <motion.div
                    key={`${cardId}-${depth.toString().replace('.', '-')}-${Math.random().toString(36).slice(2, 11)}`}
                    className="absolute"
                    initial={{
                      x: Math.random() * driftRange - driftRange / 2,
                      y: Math.random() * driftRange - driftRange / 2,
                      rotateX: initialRotateX,
                      rotateY: initialRotateY,
                      rotateZ: initialRotateZ,
                      opacity: 0
                    }}
                    animate={{
                      x: [
                        Math.random() * driftRange - driftRange / 2,
                        Math.random() * driftRange - driftRange / 2
                      ],
                      y: [
                        Math.random() * driftRange - driftRange / 2,
                        Math.random() * driftRange - driftRange / 2
                      ],
                      rotateX: [initialRotateX, initialRotateX + (Math.random() * 15 - 7.5)],
                      rotateY: [initialRotateY, initialRotateY + (Math.random() * 15 - 7.5)],
                      rotateZ: [initialRotateZ, initialRotateZ + (Math.random() * 20 - 10)],
                      opacity: [0.1 * depth, 0.25 * depth, 0.1 * depth]
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 15 + Math.random() * 15,
                      ease: "easeInOut"
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      // Standard playing card ratio (2.5 x 3.5 inches)
                      width: `${63 + (depthIndex * 15)}px`,
                      height: `${88 + (depthIndex * 21)}px`,
                      background: `url('/card/backs/card-back/${cardType}.png')`,
                      backgroundSize: 'cover',
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                      // Add depth-based shadow and blur
                      boxShadow: `0 ${10 + depthIndex * 5}px ${20 + depthIndex * 10}px rgba(0,0,0,${0.3 * depth})`,
                      filter: `blur(${(1 - depth) * 2}px)`,
                      zIndex: Math.floor(depth * 10),
                      transformOrigin: 'center',
                      borderRadius: '8px'
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="container z-10 px-4 mx-auto">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <Image
                src="/images/Royal-Blackjack-Logo.png"
                alt="Royal Blackjack Casino"
                width={300}
                height={150}
                priority
                className="drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]"
              />
            </motion.div>

            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mb-6 text-5xl font-bold text-transparent md:text-7xl bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300"
            >
              The Ultimate Blackjack Experience
            </motion.h1>

            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="max-w-3xl mb-10 text-xl md:text-2xl text-zinc-300"
            >
              Immerse yourself in the most sophisticated and realistic blackjack simulation, crafted with meticulous attention to detail and Vegas-authentic gameplay.
            </motion.p>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-4 sm:flex-row"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-8 py-6 text-lg rounded-md shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                onClick={() => router.push('/game/blackjack')}
              >
                Play Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg border-2 rounded-md border-amber-500/50 text-amber-400 hover:bg-amber-950/30"
                onClick={() => router.push('/auth/sign-up')}
              >
                Sign Up
              </Button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
          className="absolute bottom-10"
        >
          <div className="animate-bounce">
            <ChevronRight size={30} className="rotate-90 text-amber-500/70" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-zinc-900/50">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-amber-400">Exceptional Features</h2>
            <p className="max-w-3xl mx-auto text-xl text-zinc-400">
              Discover what makes Royal Blackjack Casino the premier destination for blackjack enthusiasts worldwide.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={`feature-${feature.title}`}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-zinc-800/70 border-zinc-700 backdrop-blur-sm h-full shadow-[0_10px_25px_-12px_rgba(255,215,0,0.2)]">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle className="text-2xl text-amber-300">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gameplay Preview Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-700/20 via-transparent to-transparent"></div>
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <h2 className="mb-6 text-4xl font-bold text-amber-400">
                Authentic Casino Experience
              </h2>
              <p className="mb-8 text-xl text-zinc-300">
                Royal Blackjack Casino recreates the exact atmosphere, rules, and excitement of a luxury Las Vegas casino. From the sound of shuffling cards to the tactile feel of placing bets, every detail has been meticulously crafted.
              </p>
              <ul className="mb-8 space-y-4">
                {[
                  "Authentic Vegas rules and gameplay",
                  "Stunning table designs and animations",
                  "Adaptive AI for realistic dealer interactions",
                  "Multi-hand gameplay options",
                ].map((item) => (
                  <li key={`list-item-${item}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + 0.1 * item.length, duration: 0.5 }}
                      className="flex items-center gap-3 text-zinc-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {item}
                    </motion.div>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-950/30"
                onClick={() => router.push('/info')}
              >
                Learn More About Gameplay
              </Button>
            </motion.div>

            <motion.div
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:w-1/2"
            >
              <div className="rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-zinc-700 aspect-video">
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50 group">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/80">
                    <div className="flex items-center justify-center w-16 h-16 transition-transform bg-black rounded-full group-hover:scale-110">
                      <div className="w-0 h-0 ml-1 border-y-8 border-y-transparent border-l-12 border-l-white"></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                </div>
                <Image
                  src="/images/classic-blackjack.png"
                  alt="Blackjack table gameplay"
                  width={960}
                  height={540}
                  className="object-cover w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-black">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-amber-400">What Players Say</h2>
            <p className="max-w-3xl mx-auto text-xl text-zinc-400">
              Join thousands of satisfied players who have experienced the Royal Blackjack Casino difference.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <motion.div
                key={`testimonial-${testimonial.author}`}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="h-full bg-zinc-900/70 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-6">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={`star-${testimonial.author}-${i}`}
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-amber-400"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="mb-4 italic text-zinc-200">&ldquo;{testimonial.quote}&rdquo;</p>
                    <p className="font-medium text-zinc-400">— {testimonial.author}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 to-black/50"></div>
        <div className="container relative z-10 px-4 mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="mb-6 text-4xl font-bold md:text-5xl text-amber-300">
              Ready to Experience the Royal Treatment?
            </h2>
            <p className="mb-10 text-xl md:text-2xl text-zinc-300">
              Join Royal Blackjack Casino today and elevate your blackjack gameplay to unprecedented heights.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold px-12 py-7 text-lg md:text-xl rounded-md shadow-[0_0_15px_rgba(255,215,0,0.5)]"
              onClick={() => router.push('/game')}
            >
              Play Now
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
