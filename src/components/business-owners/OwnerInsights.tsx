import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, Award, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OwnerInsightsProps {
  ownerData: any[];
}

export const OwnerInsights = ({ ownerData }: OwnerInsightsProps) => {
  // Top 3 risky business owners (most critical + high open findings)
  const riskyOwners = ownerData
    .filter(o => o.owner !== 'Unassigned')
    .map(o => ({
      ...o,
      riskScore: (o.criticalCount * 10) + (o.highCount * 5) + o.openFindings,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);

  // Most improved owner (highest fix rate with at least 5 findings)
  const improvedOwners = ownerData
    .filter(o => o.owner !== 'Unassigned' && o.totalFindings >= 5)
    .sort((a, b) => b.fixRate - a.fixRate)
    .slice(0, 1);

  // Unassigned findings
  const unassignedCount = ownerData.find(o => o.owner === 'Unassigned')?.totalFindings || 0;

  // Average fix rate
  const assignedOwners = ownerData.filter(o => o.owner !== 'Unassigned');
  const avgFixRate = assignedOwners.length > 0
    ? Math.round(assignedOwners.reduce((sum, o) => sum + o.fixRate, 0) / assignedOwners.length)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Top Risky Owners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {riskyOwners.length > 0 ? (
            riskyOwners.map((owner, index) => (
              <div key={owner.owner} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{owner.owner}</div>
                    <div className="text-xs text-muted-foreground">
                      {owner.criticalCount}C, {owner.highCount}H, {owner.openFindings} open
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-orange-500">
                    Risk Score: {owner.riskScore}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No risky owners identified</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Insights & Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {improvedOwners.length > 0 && (
            <div className="p-3 border rounded-lg bg-green-500/5">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Most Improved Owner</span>
              </div>
              <div className="font-semibold">{improvedOwners[0].owner}</div>
              <div className="text-sm text-muted-foreground">
                {improvedOwners[0].fixRate}% fix rate ({improvedOwners[0].fixedFindings}/{improvedOwners[0].totalFindings} fixed)
              </div>
            </div>
          )}

          <div className="p-3 border rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Average Fix Rate</span>
            </div>
            <div className="text-2xl font-bold">{avgFixRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {assignedOwners.length} business owners
            </div>
          </div>

          {unassignedCount > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unassigned Findings Alert</AlertTitle>
              <AlertDescription>
                {unassignedCount} findings have no business owner assigned. Please review and assign ownership.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
