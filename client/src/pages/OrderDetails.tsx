import { useState } from "react";
import { useParams, Link } from "wouter";
import { useOrderById } from "@/hooks/useOrders";
import { OrderStatus } from "@/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import OrderInvoice from "@/components/OrderInvoice";

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading } = useOrderById(parseInt(id));
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async (status: OrderStatus) => {
      await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', parseInt(id)] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/activity'] });
      
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-medium mb-4">Order Not Found</h2>
        <p className="text-neutral-500 mb-6">The order you're looking for doesn't exist or has been removed.</p>
        <Link href="/orders">
          <Button>Go Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const formattedDate = format(new Date(order.orderDate), "MMMM dd, yyyy");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm" className="mr-4">
            <span className="material-icons mr-2 text-sm">arrow_back</span>
            Back to Orders
          </Button>
        </Link>
        <h1 className="text-2xl font-medium">Order #{order.orderNumber}</h1>
      </div>

      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl">
          <OrderInvoice 
            order={order} 
            onClose={() => setIsInvoiceDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Order Number</dt>
                <dd className="mt-1">#{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Date</dt>
                <dd className="mt-1">{formattedDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Status</dt>
                <dd className="mt-1">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Total</dt>
                <dd className="mt-1 text-lg font-medium">${order.total.toFixed(2)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Name</dt>
                <dd className="mt-1">{order.client.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Email</dt>
                <dd className="mt-1">{order.client.email}</dd>
              </div>
              {order.client.phone && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Phone</dt>
                  <dd className="mt-1">{order.client.phone}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-neutral-500 mb-2">Update Status</div>
                <Select
                  value={order.status}
                  onValueChange={(value) => updateOrderStatusMutation.mutate(value as OrderStatus)}
                  disabled={updateOrderStatusMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Button 
                  className="w-full"
                  onClick={() => setIsInvoiceDialogOpen(true)}
                >
                  <span className="material-icons mr-2 text-sm">receipt</span>
                  View Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            {order.items.length} {order.items.length === 1 ? "item" : "items"} in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Product</th>
                  <th className="text-right pb-3 font-medium text-neutral-500 text-sm">Price</th>
                  <th className="text-right pb-3 font-medium text-neutral-500 text-sm">Quantity</th>
                  <th className="text-right pb-3 font-medium text-neutral-500 text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="py-4">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-neutral-500">{item.product.description}</div>
                      </div>
                    </td>
                    <td className="py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-4 text-right">{item.quantity}</td>
                    <td className="py-4 text-right">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="py-4 text-right font-medium">Total</td>
                  <td className="py-4 text-right font-medium">${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}