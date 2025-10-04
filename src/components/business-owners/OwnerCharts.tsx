import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface OwnerChartsProps {
  ownerData: any[];
}

export const OwnerCharts = ({ ownerData }: OwnerChartsProps) => {
  // Chart 1: Findings with vs without owner
  const ownershipData = [
    {
      name: 'With Owner',
      value: ownerData.filter(o => o.owner !== 'Unassigned').reduce((sum, o) => sum + o.totalFindings, 0),
    },
    {
      name: 'Unassigned',
      value: ownerData.find(o => o.owner === 'Unassigned')?.totalFindings || 0,
    },
  ];

  // Chart 2: Top 10 owners with most open findings
  const topOwnersData = ownerData
    .filter(o => o.owner !== 'Unassigned')
    .sort((a, b) => b.openFindings - a.openFindings)
    .slice(0, 10)
    .map(o => ({
      name: o.owner.length > 20 ? o.owner.substring(0, 17) + '...' : o.owner,
      openFindings: o.openFindings,
    }));

  // Chart 3: Overall severity distribution
  const severityData = [
    {
      name: 'Critical',
      value: ownerData.reduce((sum, o) => sum + o.criticalCount, 0),
      color: '#ef4444',
    },
    {
      name: 'High',
      value: ownerData.reduce((sum, o) => sum + o.highCount, 0),
      color: '#f97316',
    },
    {
      name: 'Medium',
      value: ownerData.reduce((sum, o) => sum + o.mediumCount, 0),
      color: '#eab308',
    },
    {
      name: 'Low',
      value: ownerData.reduce((sum, o) => sum + o.lowCount, 0),
      color: '#3b82f6',
    },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Findings with vs without Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ownershipData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ownershipData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Owners - Open Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topOwnersData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="openFindings" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
