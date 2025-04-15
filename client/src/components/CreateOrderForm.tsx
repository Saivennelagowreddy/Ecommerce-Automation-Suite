import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useClients } from "@/hooks/useClients";
import { useInventory } from "@/hooks/useInventory";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { OrderStatus } from "@/types";

const orderSchema = z.object({
  clientId: z.string().min(1, { message: "Please select a client" }),
  status: z.enum(["pending", "processing", "completed", "cancelled"]),
});

type OrderItem = {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

interface CreateOrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  const { clients, isLoading: isLoadingClients } = useClients();
  const { inventory, isLoading: isLoadingInventory } = useInventory();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      clientId: "",
      status: "pending" as OrderStatus,
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof orderSchema>) => {
      if (orderItems.length === 0) {
        throw new Error("Cannot create an order without items");
      }

      // Generate a unique order number (normally would be handled server-side)
      const orderNumber = `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Calculate total from items
      const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Prepare order data
      const orderData = {
        order: {
          orderNumber,
          clientId: parseInt(data.clientId),
          orderDate: new Date(),
          status: data.status,
          total,
        },
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      };

      await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order Created",
        description: "The order has been created successfully.",
        variant: "default",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      
      // Reset form
      form.reset();
      setOrderItems([]);
      
      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Order",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedProduct || quantity < 1) return;
    
    const product = inventory?.find(p => p.id === parseInt(selectedProduct));
    if (!product) return;
    
    // Check if we already have this product in the order
    const existingItemIndex = orderItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
        },
      ]);
    }
    
    // Reset selection
    setSelectedProduct("");
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const onSubmit = (data: z.infer<typeof orderSchema>) => {
    createOrderMutation.mutate(data);
  };

  // Calculate order total
  const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingClients ? (
                          <div className="p-2 text-center">Loading clients...</div>
                        ) : clients?.length ? (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center">No clients found</div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Order Summary</h3>
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Items ({orderItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                      <span>Total</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="submit" disabled={orderItems.length === 0 || createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>

            <div>
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Order Items</h3>
                
                <div className="flex gap-2 mb-4">
                  <div className="flex-1">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingInventory ? (
                          <div className="p-2 text-center">Loading products...</div>
                        ) : inventory?.length ? (
                          inventory.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ${product.price.toFixed(2)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center">No products found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button type="button" onClick={handleAddItem} disabled={!selectedProduct}>
                    Add
                  </Button>
                </div>

                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <span className="material-icons text-3xl text-neutral-300 mb-2">shopping_cart</span>
                    <p>No items added to this order</p>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveItem(item.id)}
                                className="hover:text-red-500"
                              >
                                <span className="material-icons text-sm">delete</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}