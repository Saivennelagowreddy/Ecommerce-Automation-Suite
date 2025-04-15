import { useEffect, useState } from "react";
import MetricCard from "@/components/MetricCard";
import OrdersChart from "@/components/OrdersChart";
import OrderTable from "@/components/OrderTable";
import InventoryTable from "@/components/InventoryTable";
import ClientActivity from "@/components/ClientActivity";
import { useAnalytics } from "@/hooks/useAnalytics";

const Dashboard = () => {
  const { analytics, isLoading } = useAnalytics();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Generate some sample chart data
    const generateChartData = () => {
      const data = [];
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Generate random data for the demo
        data.push({
          date: date.toISOString().slice(5, 10), // MM-DD format
          orders: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 2000) + 500,
        });
      }
      
      return data;
    };
    
    setChartData(generateChartData());
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Dashboard</h1>
      
      {/* Analytics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard 
          title="Orders Today" 
          value={isLoading ? "..." : analytics?.ordersToday || 0}
          icon="shopping_cart" 
          iconBgColor="bg-blue-100"
          trend={{ value: "12%", isPositive: true }}
        />
        <MetricCard 
          title="Revenue" 
          value={isLoading ? "..." : `$${analytics?.revenue?.toLocaleString() || 0}`}
          icon="attach_money" 
          iconBgColor="bg-green-100"
          trend={{ value: "8%", isPositive: true }}
        />
        <MetricCard 
          title="Low Stock Items" 
          value={isLoading ? "..." : analytics?.lowStockItems || 0}
          icon="inventory_2" 
          iconBgColor="bg-orange-100"
          trend={{ value: "3", isPositive: false }}
        />
        <MetricCard 
          title="New Clients" 
          value={isLoading ? "..." : analytics?.newClients || 0}
          icon="people" 
          iconBgColor="bg-purple-100"
          trend={{ value: "5%", isPositive: true }}
        />
      </div>
      
      {/* Charts & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <OrdersChart data={chartData} />
        <OrderTable />
      </div>
      
      {/* Inventory & Clients Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <InventoryTable />
        <ClientActivity />
      </div>
    </div>
  );
};

export default Dashboard;
