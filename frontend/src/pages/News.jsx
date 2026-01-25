import Card, { EmptyState } from '../components/common/Card';

// Icons
const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const NewspaperIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

const ChartBarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LightBulbIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const features = [
  {
    icon: NewspaperIcon,
    title: 'News Summaries',
    description: 'AI-generated summaries of the latest news affecting your holdings.',
  },
  {
    icon: ChartBarIcon,
    title: 'Portfolio Health Check',
    description: 'Analyze your portfolio concentration and diversification.',
  },
  {
    icon: LightBulbIcon,
    title: 'Rebalancing Suggestions',
    description: 'Get recommendations for optimizing your portfolio allocation.',
  },
];

export default function News() {
  return (
    <div className="container-app py-6 sm:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">News & Insights</h1>
        <p className="text-secondary-500 mt-1">AI-powered analysis for your portfolio</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 opacity-50" />

          {/* Content */}
          <div className="relative py-12 px-6 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-6">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-bold text-secondary-900 mb-3">
              AI Features Coming Soon
            </h2>
            <p className="text-secondary-600 max-w-lg mx-auto mb-8">
              We're building intelligent features to help you make better investment decisions.
              Stay tuned for AI-powered insights about your portfolio.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-secondary-100 hover:border-primary-200 hover:shadow-soft transition-all duration-200"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg mb-3">
                    <feature.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-secondary-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-secondary-500">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Phase indicator */}
            <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 rounded-full text-sm text-secondary-600">
              <span className="w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
              Planned for Phase 4
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
