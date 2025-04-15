import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Order } from "@shared/schema";
import { RecentOrder } from "@/types";

interface OrderTableProps {
  title?: string;
  limit?: number;
  showViewAll?: boolean;
}

const OrderTable = ({ title = "Recent Orders", limit = 5, showViewAll = true }: OrderTableProps) => {
  const { data: orders, isLoading } = useQuery<RecentOrder[]>({
    queryKey: ['/api/orders/recent'],
  });

  // Slice to show only the specified number of orders
  const displayOrders = orders ? orders.slice(0, limit) : [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {showViewAll && (
          <Link href="/orders">
            <a className="text-primary text-sm hover:underline">View All</a>
          </Link>
        )}
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            <span className="material-icons text-3xl text-neutral-300 mb-2">shopping_cart_off</span>
            <p>No orders found</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Order ID</th>
                <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Customer</th>
                <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayOrders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100">
                  <td className="py-3 text-sm">
                    <Link href={`/orders/${order.id}`}>
                      <a className="text-primary hover:underline">
                        #{order.orderNumber}
                      </a>
                    </Link>
                  </td>
                  <td className="py-3 text-sm">{order.clientName}</td>
                  <td className="py-3 text-sm">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  let color = '';
  
  switch (status) {
    case 'completed':
      color = 'bg-green-100 text-green-800';
      break;
    case 'processing':
      color = 'bg-blue-100 text-blue-800';
      break;
    case 'pending':
      color = 'bg-yellow-100 text-yellow-800';
      break;
    case 'cancelled':
      color = 'bg-red-100 text-red-800';
      break;
    default:
      color = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default OrderTable;
