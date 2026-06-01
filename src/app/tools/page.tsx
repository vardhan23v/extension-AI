import Link from 'next/link';
import { Card } from '@/components/ui';

export const metadata = { title: 'Tools — TalentDash', description: 'Career tools and calculators for tech professionals.' };

const TOOLS = [
  {
    href: '/tools/salary-calculator',
    icon: '💰',
    title: 'Salary Calculator',
    description: 'Break down your CTC into in-hand salary with PF, tax, and deductions.',
  },
  {
    href: '/tools/hike-calculator',
    icon: '📈',
    title: 'Hike Calculator',
    description: 'Calculate your percentage hike and compare with market averages.',
  },
  {
    href: '/tools/offer-comparison',
    icon: '⚖️',
    title: 'Offer Comparison',
    description: 'Compare multiple job offers side-by-side across all compensation components.',
  },
  {
    href: '/tools/tax-calculator',
    icon: '🧮',
    title: 'Tax Calculator',
    description: 'Calculate income tax under old and new regime for Indian income tax.',
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-h1 text-heading">Career Tools</h1>
        <p className="text-body text-muted mt-2">Free calculators and tools to help you make better financial decisions</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 stagger-children">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card hover className="h-full group">
              <span className="text-4xl mb-4 block">{tool.icon}</span>
              <h2 className="text-h3 text-heading mb-2 group-hover:text-primary transition-colors">{tool.title}</h2>
              <p className="text-body text-muted">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
