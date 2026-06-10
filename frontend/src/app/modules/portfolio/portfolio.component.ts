import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LayoutService } from '../../@core/services/layout.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit {

  private router = inject(Router);
  protected readonly layoutService = inject(LayoutService);

  isMobileMenuOpen = signal(false);
  yearsOfExperience = '2.9';

  profile = {
    name: 'Sayantan Sadhu',
    title: 'Software Engineer',
    email: 'sayantan.111sadhu@gmail.com',
    phone: '6296126935',
    github: 'https://github.com/sayantansadhu',
    linkedin: 'https://linkedin.com/in/sayantansadhu414'
  };

  skills = [
    { category: 'Frontend', items: ['Angular', 'HTML5', 'CSS3', 'Tailwind CSS'] },
    { category: 'Backend', items: ['Node.js', 'REST APIs', 'Real-time APIs', 'Cron Jobs'] },
    { category: 'Databases', items: ['MongoDB', 'MySQL', 'PostgreSQL'] },
    { category: 'Mobile & Real-time', items: ['Flutter (Android)', 'Socket.io', 'MQTT'] },
    { category: 'Languages', items: ['JavaScript', 'TypeScript', 'Dart', 'Python'] },
    { category: 'Tools & Practices', items: ['Git', 'Postman', 'OPC Logger', 'Trello', 'Agile', 'AI Tools'] }
  ];

  achievements = [
    {
      metric: '5,000+',
      label: 'Active Users Supported',
      desc: 'Engineered web solutions for major industrial and railway enterprise users.'
    },
    {
      metric: '20%',
      label: 'System Downtime Reduced',
      desc: 'Optimized server gateway architectures, database indexes, and API latency.'
    },
    {
      metric: '65+',
      label: 'Production Issues Resolved',
      desc: 'Identified and fixed bottlenecks in large-scale Angular and Node.js codebases.'
    },
    {
      metric: '50+',
      label: 'Custom APIs Designed',
      desc: 'Designed high-throughput reporting endpoints for complex operations.'
    }
  ];

  projects = [
    {
      title: 'Unified Plant View (UPV)',
      client: 'IISCO (SAIL)',
      description: 'Core dashboard integration visualizing real-time operations across 10+ plant units.',
      role: 'Frontend & Backend Contributor',
      tech: ['Angular', 'Node.js', 'MongoDB']
    },
    {
      title: 'Traffic Railway Information System (TRIS)',
      client: 'Indian Railways & SAIL Joint Venture',
      description: 'Wagon traffic control and management service streamlining railway logistics tracking.',
      role: 'Module Architect',
      tech: ['Angular', 'Node.js', 'PostgreSQL']
    },
    {
      title: 'Satark Alert System',
      client: 'Railway Safety Operations',
      description: 'Emergency notification app featuring multi-level alerts, device vibration, alarm, and hardware flashlight sync.',
      role: 'Mobile Developer',
      tech: ['Flutter', 'MQTT', 'Socket.io']
    },
    {
      title: 'Margdarshak Platform',
      client: 'Loco Pilot Testing',
      description: 'Real-time exam and scenario evaluation interface testing railway signals decision making.',
      role: 'Full Stack Mobile Lead',
      tech: ['Flutter', 'Node.js', 'REST APIs']
    },
    {
      title: 'Ranchi Mines Management',
      client: 'Industrial Operations',
      description: 'High-performance reporting engine delivering immediate status logs and management analytics.',
      role: 'Backend Architect',
      tech: ['Node.js', 'MySQL', 'REST APIs']
    },
    {
      title: 'HRMX',
      client: 'SoftMeets Enterprise',
      description: 'Contributed to an Angular-based Human Resource Management platform supporting feature expansion, issue resolution, and performance tuning for 200+ employees.',
      role: 'Frontend Developer Intern',
      tech: ['Angular', 'TypeScript', 'CSS3']
    }
  ];

  experience = [
    {
      role: 'Software Engineer',
      company: 'SoftMeets Info Solutions Pvt. Ltd.',
      duration: 'Jul 2023 - Present',
      location: 'Asansol, India',
      summary: 'Delivering Angular, Node.js, and Flutter systems for critical railway and industrial operations. Specialized in creating high-availability architectures and optimizing APIs.'
    },
    {
      role: 'Software Engineer Intern',
      company: 'SoftMeets Info Solutions Pvt. Ltd.',
      duration: 'Dec 2022 - Jun 2023',
      location: 'Asansol, India',
      summary: 'Collaborated on Hospital and HR Management tools, fixing frontend bugs and developing responsive layout elements for internal platforms.'
    }
  ];

  education = {
    degree: 'B.Tech - Computer Science and Engineering',
    duration: '2019 - 2023',
    institution: 'Dream Institute of Technology (MAKAUT University)',
    grade: 'CGPA: 8.72 / 10'
  };

  ngOnInit() {
    this.calculateExperience();
  }

  calculateExperience() {
    const joiningDate = new Date(2023, 6, 1); // July 1, 2023
    const currentDate = new Date();

    // Calculate years from July 2023 only, excluding internship
    const diffInMs = currentDate.getTime() - joiningDate.getTime();
    const diffInYears = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
    this.yearsOfExperience = diffInYears.toFixed(1);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
