'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code, Shield, Users, Zap, BarChart3, Globe } from 'lucide-react';
import { Card3D } from '@/components/ui/card-3d';

const features = [
  {
    icon: Code,
    title: 'AI-Powered Analysis',
    description: 'Advanced machine learning algorithms analyze your code for compatibility issues, security vulnerabilities, and performance bottlenecks in real-time.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security with role-based access control, encrypted data transmission, and compliance with SOC 2, GDPR, and HIPAA standards.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture',
    description: 'Scalable platform supporting unlimited organizations with isolated data, customizable workflows, and team collaboration features.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Real-Time Monitoring',
    description: 'Live dashboard with WebSocket updates, comprehensive metrics, intelligent alerting, and automated remediation workflows.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Detailed reports, trend analysis, predictive insights, and actionable recommendations to improve your software quality over time.',
    gradient: 'from-red-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Integration Ecosystem',
    description: 'Seamlessly integrate with GitHub, GitLab, Bitbucket, Jira, Slack, Teams, and 50+ tools via webhooks and REST APIs.',
    gradient: 'from-cyan-500 to-blue-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export function Features() {
  return (
    <section className="section relative">
      <div className="container-modern">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Everything You Need</span>
            <br />
            for Code Excellence
          </h2>
          <p className="text-xl text-gray-400">
            Powerful features designed for modern development teams who demand
            excellence, security, and scalability.
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card3D intensity={10} glowEffect>
                {/* Icon with Gradient */}
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Decorative Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl -z-10" />
              </Card3D>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
