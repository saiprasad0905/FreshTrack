import { AppLayout } from "@/components/layout/AppLayout";
import { useWasteAnalyticsQuery } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { Trophy, TrendingUp, IndianRupee, Leaf } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export function Analytics() {
  const { data: stats, isLoading } = useWasteAnalyticsQuery();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-64 bg-card rounded-3xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-card rounded-3xl"></div>
            <div className="h-32 bg-card rounded-3xl"></div>
            <div className="h-32 bg-card rounded-3xl"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) return null;

  const pieData = [
    { name: "Consumed", value: stats.totalConsumed, color: "hsl(var(--success))" },
    { name: "Wasted", value: stats.totalWasted, color: "hsl(var(--destructive))" },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Impact & Analytics</h1>
          <p className="text-muted-foreground mt-1">See how your habits affect your wallet and the planet.</p>
        </header>

        {/* Hero Gamification Card */}
        <div className="bg-card rounded-3xl p-8 border border-border shadow-xl shadow-primary/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-32 h-32 shrink-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/eco-badge.png`} 
              alt="Eco Level Badge" 
              className="w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-500 cursor-pointer"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/20 text-yellow-700 font-bold text-sm mb-3">
              <Trophy className="w-4 h-4" /> Level Up!
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              {stats.level}
            </h2>
            <p className="text-muted-foreground max-w-md">
              You're doing great! You have a {stats.streak} day streak of not wasting any food. Keep it up!
            </p>
          </div>
          
          <div className="bg-background rounded-2xl p-6 border border-border w-full md:w-auto text-center shrink-0">
            <div className="text-4xl font-display font-bold text-primary mb-1">
              {stats.wasteAvoidanceRate}%
            </div>
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Avoidance Rate
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <IndianRupee className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-muted-foreground font-medium mb-1">Money Saved</h3>
            <p className="text-3xl font-display font-bold text-foreground">{formatCurrency(stats.moneySaved)}</p>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Leaf className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-muted-foreground font-medium mb-1">CO₂ Prevented</h3>
            <p className="text-3xl font-display font-bold text-foreground">{stats.carbonSaved} kg</p>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-muted-foreground font-medium mb-1">Value Wasted</h3>
            <p className="text-3xl font-display font-bold text-foreground">{formatCurrency(stats.moneyWasted)}</p>
          </div>
        </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
            <h3 className="font-display font-bold text-xl mb-6">Consumption vs Waste</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: 'var(--shadow-hover)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-muted-foreground">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-card to-emerald-50/30 rounded-3xl border border-border shadow-sm p-6 flex flex-col justify-center">
            <h3 className="font-display font-bold text-xl mb-4">Did you know?</h3>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              Throwing away food doesn't just waste money—it contributes heavily to greenhouse gas emissions. 
              By saving <span className="font-bold text-primary">{stats.totalConsumed} items</span>, 
              you've made a real difference!
            </p>
            <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Your carbon savings equal driving a car for <span className="text-primary font-bold">{Math.round(stats.carbonSaved * 4)} miles</span> less!
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
