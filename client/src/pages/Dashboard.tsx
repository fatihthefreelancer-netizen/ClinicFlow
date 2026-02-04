import { Layout } from "@/components/Layout";
import { useProfile } from "@/hooks/use-profile";
import { useAnalytics } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { subDays, format } from "date-fns";
import { Loader2, Users, DollarSign, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { role, isLoading: isProfileLoading } = useProfile();
  const [, setLocation] = useLocation();

  // Protect route
  useEffect(() => {
    if (!isProfileLoading && role !== "doctor") {
      setLocation("/");
    }
  }, [role, isProfileLoading, setLocation]);

  const endDate = new Date().toISOString();
  const startDate = subDays(new Date(), 30).toISOString();

  const { data: analytics, isLoading, error } = useAnalytics({ startDate, endDate });

  console.log("Dashboard state raw:", { isLoading, error, analytics });

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <p className="text-red-500 font-medium">Failed to load analytics: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </Layout>
    );
  }

  if (isProfileLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-slate-500">Analyzing clinic data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (role !== "doctor") return null;

  const stats = analytics || {
    totalPatients: 0,
    totalRevenue: 0,
    averagePrice: 0,
    patientsPerDay: []
  };

  const chartData = (stats.patientsPerDay || []).map(d => ({
    ...d,
    date: d.date ? new Date(d.date).getTime() : 0
  })).filter(d => d.date > 0);

  const handleExport = () => {
    const params = new URLSearchParams({ 
      startDate: new Date(startDate).toISOString(), 
      endDate: new Date(endDate).toISOString() 
    });
    window.location.href = `/api/export?${params.toString()}`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clinic Analytics</h1>
            <p className="text-slate-500 mt-1">Performance overview for the last 30 days</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalPatients}</div>
              <p className="text-xs text-slate-400 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${stats.totalRevenue ? (stats.totalRevenue / 100).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total accumulated</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Avg. Consultation</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                ${stats.averagePrice ? (stats.averagePrice / 100).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-slate-400 mt-1">Per patient</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm col-span-2">
            <CardHeader>
              <CardTitle>Patient Volume Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      type="number"
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => {
                        try {
                          return format(new Date(value), "MMM d");
                        } catch (e) {
                          return "";
                        }
                      }}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      labelFormatter={(value) => {
                        try {
                          return format(new Date(value), "MMM d, yyyy");
                        } catch (e) {
                          return "";
                        }
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
