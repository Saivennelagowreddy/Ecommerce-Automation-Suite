import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { OrderStatus } from "@/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OrderTable from "@/components/OrderTable";
import CreateOrderForm from "@/components/CreateOrderForm";

const Orders = () => {
  const { orders, isLoading } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: OrderStatus }) => {
      await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the order status.",
        variant: "destructive",
      });
    }
  });

  const handleCreateOrderSuccess = () => {
    setIsCreateOrderDialogOpen(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Orders</h1>
      
      <Dialog open={isCreateOrderDialogOpen} onOpenChange={setIsCreateOrderDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>
          <CreateOrderForm
            onSuccess={handleCreateOrderSuccess}
            onCancel={() => setIsCreateOrderDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Orders</CardTitle>
          <CardDescription>View and manage customer orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by order number or customer name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="md:w-auto"
              onClick={() => setIsCreateOrderDialogOpen(true)}
            >
              <span className="material-icons mr-2 text-sm">add</span>
              New Order
            </Button>
          </div>
          
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <OrderTable title="" showViewAll={false} />
            </TabsContent>
            <TabsContent value="pending">
              <OrderTable title="" showViewAll={false} />
            </TabsContent>
            <TabsContent value="processing">
              <OrderTable title="" showViewAll={false} />
            </TabsContent>
            <TabsContent value="completed">
              <OrderTable title="" showViewAll={false} />
            </TabsContent>
            <TabsContent value="cancelled">
              <OrderTable title="" showViewAll={false} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
