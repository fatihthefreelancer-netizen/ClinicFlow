import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Users, TrendingUp, Activity } from "lucide-react";
import { useMockVisits } from "@/context/MockVisitsContext";
import { format, subDays, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState, useEffect } from "react";

const validStatuses = ["waiting", "in_consultation", "done"] as const;

export default function Dashboard() {
  const { getVisitsForDate, getVisitsInRange, loadVisitsForDate, loadVisitsInRange } = useMockVisits();
  const [todayDate] = useState(() => new Date());
  const todayStr = format(todayDate, "yyyy-MM-dd");
  const monthStart = startOfMonth(todayDate);
  const monthStartStr = format(monthStart, "yyyy-MM-dd");
  const monthName = format(todayDate, "MMMM", { locale: fr });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const chartStartStr = format(subDays(todayDate, 6), "yyyy-MM-dd");

  useEffect(() => {
    loadVisitsForDate(todayStr);
    loadVisitsInRange(monthStartStr, todayStr);
    loadVisitsInRange(chartStartStr, todayStr);
  }, [todayStr, monthStartStr, chartStartStr, loadVisitsForDate, loadVisitsInRange]);

  const visitsToday = getVisitsForDate(todayStr);
  const currentMonthVisits = getVisitsInRange(monthStartStr, todayStr);

  const patientsAujourdhui = useMemo(() => {
    return visitsToday.filter((v) => validStatuses.includes(v.status as typeof validStatuses[number])).length;
  }, [visitsToday]);

  const statsMensuelles = useMemo(() => {
    const monthPatients = currentMonthVisits.filter((v) => validStatuses.includes(v.status as typeof validStatuses[number]));
    const dayOfMonth = todayDate.getDate();
    const avgPatients = dayOfMonth > 0 ? monthPatients.length / dayOfMonth : 0;

    const patientsWithPrice = currentMonthVisits.filter((v) => v.price != null && v.price !== undefined);
    const totalPrice = patientsWithPrice.reduce((sum, v) => sum + (v.price || 0), 0);
    const avgPrice = patientsWithPrice.length > 0 ? totalPrice / patientsWithPrice.length : 0;

    return {
      avgPatients: avgPatients.toFixed(1),
      avgPrice: Math.round(avgPrice),
    };
  }, [currentMonthVisits, todayDate]);

  const rangeVisits = getVisitsInRange(chartStartStr, todayStr);

  const chartData = useMemo(() => {
    const days: { day: string; total: number; mutuelle: number; mutuelleRemplie: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(todayDate, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayLabel = format(d, "dd MMM", { locale: fr });
      const dayVisits = rangeVisits.filter((v) => v.visitDate === dateStr && validStatuses.includes(v.status as typeof validStatuses[number]));
      const total = dayVisits.length;
      const mutuelle = dayVisits.filter((v) => v.mutuelle === "Oui").length;
      const mutuelleRemplie = dayVisits.filter((v) => v.mutuelle === "Oui" && v.mutuelleRemplie === "Oui").length;
      days.push({ day: dayLabel, total, mutuelle, mutuelleRemplie });
    }
    return days;
  }, [rangeVisits, todayDate]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Aperçu des performances</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium text-slate-500">Nombre de patients aujourd'hui</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{patientsAujourdhui}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium text-slate-500">
                Moyenne de patients par jour – {capitalizedMonth}
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{statsMensuelles.avgPatients}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium text-slate-500">
                Prix moyen par consultation – {capitalizedMonth}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{statsMensuelles.avgPrice} MAD</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Nombre de patients par jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Patients"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mutuelle"
                      name="Mutuelle = Oui"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="mutuelleRemplie"
                      name="Mutuelle Remplie = Oui"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
