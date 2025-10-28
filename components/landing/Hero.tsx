'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Lock } from 'lucide-react';
import { ButtonModern } from '@/components/ui/button-modern';
import { AnimatedBackground } from '@/components/ui/animated-background';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Content */}
      <div className="container-modern relative z-10 pt-32 pb-20">
        <motion.div
          className="text-center max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                     backdrop-blur-xl bg-white/10 border border-white/20 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white/90">
              AI-Powered Compatibility Analysis
            </span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1
            className="hero-title gradient-text mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Secure Your Code.
            <br />
            Scale Your Systems.
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Enterprise-grade compatibility analysis with AI-powered insights,
            real-time monitoring, and comprehensive security scanning for modern development teams.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Link href="/sign-up">
              <ButtonModern
                variant="gradient"
                size="lg"
                glow
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
              >
                Get Started Free
              </ButtonModern>
            </Link>
            
            <Link href="/demo">
              <ButtonModern
                variant="secondary"
                size="lg"
              >
                Watch Demo
              </ButtonModern>
            </Link>
          </motion.div>
          
          {/* Trust Indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Shield className="w-4 h-4 text-green-400" />
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>99.9% Uptime</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Floating Cards - Visual Elements */}
        <motion.div
          className="absolute top-1/4 left-10 w-64 h-64"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="glass-card p-6 glow-effect">
            <div className="text-4xl font-bold gradient-text">10M+</div>
            <div className="text-sm text-white/70 mt-2">Lines Analyzed</div>
          </div>
        </motion.div>
        
        <motion.div
          className="absolute top-1/3 right-10 w-64 h-64"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        >
          <div className="glass-card p-6 glow-effect">
            <div className="text-4xl font-bold gradient-text">5,000+</div>
            <div className="text-sm text-white/70 mt-2">Organizations</div>
          </div>
        </motion.div>
        
        <motion.div
          className="absolute bottom-32 left-1/4 w-56 h-56"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 3, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        >
          <div className="glass-card p-6 glow-effect">
            <div className="text-4xl font-bold gradient-text">99.9%</div>
            <div className="text-sm text-white/70 mt-2">Uptime SLA</div>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-white rounded-full"
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
