import { useNavigate } from 'react-router-dom';
import { Server, Cloud, Shield, Wifi } from 'lucide-react';

/**
 * Account Selection Dashboard
 * 
 * This page is shown after successful login.
 * Users can select which vulnerability module to access:
 * - Internal Server Scans
 * - Cloudflare Vulnerabilities
 */
const AccountSelection = () => {
  const navigate = useNavigate();

  const accounts = [
    {
      id: 'internal',
      title: 'Internal Server Scans',
      description: 'View and manage internal server vulnerabilities',
      icon: Server,
      secondaryIcon: Shield,
      route: '/internal',
      gradient: 'from-blue-500 to-blue-700',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-800',
      shadowColor: 'shadow-blue-500/30',
    },
    {
      id: 'cloudflare',
      title: 'Cloudflare',
      description: 'Manage Cloudflare DNS & security vulnerabilities',
      icon: Cloud,
      secondaryIcon: Wifi,
      route: '/cloudflare',
      gradient: 'from-orange-500 to-orange-700',
      hoverGradient: 'hover:from-orange-600 hover:to-orange-800',
      shadowColor: 'shadow-orange-500/30',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Vulnerability Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a module to get started
        </p>
      </div>

      {/* Account Cards */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {accounts.map((account) => {
          const Icon = account.icon;
          const SecondaryIcon = account.secondaryIcon;
          
          return (
            <button
              key={account.id}
              onClick={() => navigate(account.route)}
              className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
            >
              {/* Circular Card */}
              <div
                className={`
                  relative w-44 h-44 md:w-52 md:h-52 rounded-full 
                  bg-gradient-to-br ${account.gradient} ${account.hoverGradient}
                  shadow-xl ${account.shadowColor}
                  flex items-center justify-center
                  transform transition-all duration-300 ease-out
                  group-hover:scale-105 group-hover:shadow-2xl
                  cursor-pointer
                `}
              >
                {/* Inner glow effect */}
                <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-sm" />
                
                {/* Icons Container */}
                <div className="relative z-10 flex flex-col items-center">
                  <Icon className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" strokeWidth={1.5} />
                  <SecondaryIcon className="w-6 h-6 md:w-8 md:h-8 text-white/80 mt-2" strokeWidth={2} />
                </div>

                {/* Decorative ring */}
                <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/30 transition-colors" />
                
                {/* Outer ring animation on hover */}
                <div className="absolute -inset-2 rounded-full border-2 border-transparent group-hover:border-white/10 transition-colors" />
              </div>

              {/* Label */}
              <div className="mt-6 text-center">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {account.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                  {account.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-16 text-sm text-muted-foreground">
        Click on a module to view vulnerabilities
      </p>
    </div>
  );
};

export default AccountSelection;
