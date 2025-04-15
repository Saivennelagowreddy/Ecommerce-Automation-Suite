import { useQuery, useMutation } from "@tanstack/react-query";
import { LowStockItem } from "@/types";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface InventoryTableProps {
  title?: string;
  limit?: number;
  showManageLink?: boolean;
}

const InventoryTable = ({ 
  title = "Low Stock Items", 
  limit = 5, 
  showManageLink = true 
}: InventoryTableProps) => {
  const { data: items, isLoading } = useQuery<LowStockItem[]>({
    queryKey: ['/api/inventory/low-stock'],
  });

  const restockMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest('POST', `/api/inventory/${productId}/restock`, { quantity: 10 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      toast({
        title: "Restock Successful",
        description: "The item has been restocked with 10 units.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Restock Failed",
        description: error.message || "There was an error restocking the item.",
        variant: "destructive",
      });
    }
  });

  // Slice to show only the specified number of items
  const displayItems = items ? items.slice(0, limit) : [];

  const handleRestock = (productId: number) => {
    restockMutation.mutate(productId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {showManageLink && (
          <a href="#inventory" className="text-primary text-sm hover:underline">
            Manage Inventory
          </a>
        )}
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            <span className="material-icons text-3xl text-neutral-300 mb-2">inventory_2</span>
            <p>No low stock items</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Product</th>
                <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Stock</th>
                <th className="text-left pb-3 font-medium text-neutral-500 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-3 text-sm">{item.name}</td>
                  <td className="py-3 text-sm">
                    <span className={`${item.currentStock <= 3 ? 'text-error' : 'text-warning'} font-medium`}>
                      {item.currentStock}
                    </span> / {item.threshold}
                  </td>
                  <td className="py-3 text-sm">
                    <button 
                      className="text-primary hover:underline text-sm"
                      onClick={() => handleRestock(item.id)}
                      disabled={restockMutation.isPending}
                    >
                      {restockMutation.isPending ? 'Processing...' : 'Restock'}
                    </button>
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

export default InventoryTable;
