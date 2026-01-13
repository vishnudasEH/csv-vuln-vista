import { useLocation, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Cloudflare Module Header Navigation
 * Shows navigation tabs for all cloudflare pages
 */

interface NavTab {
  path: string;
  label: string;
}

const navTabs: NavTab[] = [
  { path: '/cloudflare', label: 'Dashboard' },
  { path: '/cloudflare/vulnerabilities', label: 'Vulnerabilities' },
  { path: '/cloudflare/insights', label: 'Insights' },
  { path: '/cloudflare/trends', label: 'Trends' },
  { path: '/cloudflare/reports', label: 'Reports' },
  { path: '/cloudflare/settings', label: 'Settings' },
];

const CloudflareHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="border-b bg-card">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <Home className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-1 overflow-x-auto">
            {navTabs.map((tab) => (
              <Button
                key={tab.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(tab.path)}
                className={cn(
                  'whitespace-nowrap',
                  location.pathname === tab.path && 'bg-muted text-primary font-medium'
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudflareHeader;
