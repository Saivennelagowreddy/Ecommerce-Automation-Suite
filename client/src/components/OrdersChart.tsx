import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface OrdersChartProps {
  data: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}

const OrdersChart = ({ data }: OrdersChartProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  // Filter data based on selected time range
  const filteredData = data;

  return (
    <div className="bg-white rounded-lg shadow col-span-2 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Orders Overview</h2>
        <div className="flex space-x-2">
          <button 
            className={`text-sm ${
              timeRange === 'week' 
                ? 'bg-primary text-white' 
                : 'bg-neutral-100 hover:bg-neutral-200'
            } py-1 px-3 rounded`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={`text-sm ${
              timeRange === 'month' 
                ? 'bg-primary text-white' 
                : 'bg-neutral-100 hover:bg-neutral-200'
            } py-1 px-3 rounded`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button 
            className={`text-sm ${
              timeRange === 'year' 
                ? 'bg-primary text-white' 
                : 'bg-neutral-100 hover:bg-neutral-200'
            } py-1 px-3 rounded`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="h-64 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="orders" stackId="1" stroke="#3f51b5" fill="#3f51b580" />
              <Area type="monotone" dataKey="revenue" stackId="2" stroke="#4caf50" fill="#4caf5080" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-neutral-50 rounded border border-neutral-100">
            <div className="text-center">
              <span className="material-icons text-4xl text-neutral-300">insert_chart</span>
              <p className="text-neutral-400 mt-2">No chart data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersChart;
