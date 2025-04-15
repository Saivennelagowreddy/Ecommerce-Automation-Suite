import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { insertProductSchema, Product } from "@shared/schema";
import InventoryTable from "@/components/InventoryTable";
import ExportImportData from "@/components/ExportImportData";

const productSchema = insertProductSchema.extend({
  // Add additional validation rules
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  price: z.number().min(0.01, { message: "Price must be greater than 0" }),
  stockQuantity: z.number().int().min(0, { message: "Stock quantity must be a positive number" }),
});

// Schema for updating a product - includes ID
const updateProductSchema = productSchema.extend({
  id: z.number(),
});

type ProductFormData = z.infer<typeof productSchema>;

const Inventory = () => {
  const { inventory, isLoading } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isExportImportDialogOpen, setIsExportImportDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(10);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stockQuantity: 0,
      lowStockThreshold: 5,
    },
  });

  // Handle opening edit dialog and populating form
  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
    });
    setIsEditDialogOpen(true);
  };

  // Handle opening restock dialog
  const handleRestockClick = (product: Product) => {
    setCurrentProduct(product);
    setRestockQuantity(10); // Default restock amount
    setIsRestockDialogOpen(true);
  };

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest('POST', '/api/inventory', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Product Added",
        description: "The product has been added successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Add Failed",
        description: error.message || "There was an error adding the product.",
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData & { id: number }) => {
      await apiRequest('PATCH', `/api/inventory/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Product Updated",
        description: "The product has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the product.",
        variant: "destructive",
      });
    }
  });

  // Restock product mutation
  const restockProductMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest('POST', `/api/inventory/${id}/restock`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      setIsRestockDialogOpen(false);
      toast({
        title: "Product Restocked",
        description: "The product has been restocked successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Restock Failed",
        description: error.message || "There was an error restocking the product.",
        variant: "destructive",
      });
    }
  });

  const importProductsMutation = useMutation({
    mutationFn: async (productsData: any[]) => {
      // This would be more complex in a real app - handling validation, duplicates, etc.
      const promises = productsData.map(product => 
        apiRequest('POST', '/api/inventory', {
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          price: parseFloat(product.price) || 0,
          stockQuantity: parseInt(product.stockQuantity) || 0,
          lowStockThreshold: parseInt(product.lowStockThreshold) || 5,
        })
      );
      
      await Promise.all(promises);
      return promises.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/low-stock'] });
      toast({
        title: "Import Successful",
        description: `${count} products have been imported.`,
        variant: "default",
      });
      setIsExportImportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message || "There was an error importing the products.",
        variant: "destructive",
      });
    }
  });

  // Form submission handlers
  const onAddSubmit = (data: ProductFormData) => {
    addProductMutation.mutate(data);
  };

  const onEditSubmit = (data: ProductFormData) => {
    if (!currentProduct) return;
    updateProductMutation.mutate({ ...data, id: currentProduct.id });
  };

  const onRestockSubmit = () => {
    if (!currentProduct) return;
    restockProductMutation.mutate({ id: currentProduct.id, quantity: restockQuantity });
  };

  const handleImport = (data: any[]) => {
    importProductsMutation.mutate(data);
  };

  // Filter inventory based on search term
  const filteredInventory = inventory?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Inventory</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Inventory</CardTitle>
          <CardDescription>View and manage product inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="md:w-auto">
                  <span className="material-icons mr-2 text-sm">add</span>
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Enter the product details below to add it to your inventory.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                step="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              step="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addProductMutation.isPending}
                      >
                        {addProductMutation.isPending ? 'Saving...' : 'Add Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            {/* Edit Product Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>
                    Update the product details below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                step="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              step="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={updateProductMutation.isPending}
                      >
                        {updateProductMutation.isPending ? 'Saving...' : 'Update Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Restock Dialog */}
            <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Restock Product</DialogTitle>
                  <DialogDescription>
                    Add inventory to {currentProduct?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Current Stock: {currentProduct?.stockQuantity}</div>
                    <Input
                      type="number"
                      min="1"
                      step="1" 
                      value={restockQuantity.toString()} 
                      onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 10)}
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={onRestockSubmit} 
                    disabled={restockProductMutation.isPending}
                  >
                    {restockProductMutation.isPending ? 'Restocking...' : 'Restock Product'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isExportImportDialogOpen} onOpenChange={setIsExportImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="md:w-auto">
                  <span className="material-icons mr-2 text-sm">import_export</span>
                  Export/Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Export/Import Inventory</DialogTitle>
                  <DialogDescription>
                    Export your inventory to CSV or import inventory from a CSV file.
                  </DialogDescription>
                </DialogHeader>
                <ExportImportData 
                  dataType="inventory"
                  data={inventory || []}
                  onImport={handleImport}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 font-medium text-neutral-500 text-sm">Product</th>
                  <th className="text-left py-3 font-medium text-neutral-500 text-sm">Price</th>
                  <th className="text-left py-3 font-medium text-neutral-500 text-sm">Stock</th>
                  <th className="text-left py-3 font-medium text-neutral-500 text-sm">Low Stock Threshold</th>
                  <th className="text-right py-3 font-medium text-neutral-500 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-neutral-500">
                      <span className="material-icons text-3xl text-neutral-300 mb-2">inventory_2</span>
                      <p>{searchTerm ? 'No matching products found' : 'No products in inventory'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((product) => (
                    <tr key={product.id} className="border-b border-neutral-100">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-neutral-500">{product.description}</div>
                        </div>
                      </td>
                      <td className="py-3">${product.price.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`${product.stockQuantity <= product.lowStockThreshold ? 'text-error' : ''} font-medium`}>
                          {product.stockQuantity}
                        </span> 
                        {product.stockQuantity <= product.lowStockThreshold && (
                          <span className="ml-2 text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">
                            Low Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3">{product.lowStockThreshold}</td>
                      <td className="py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary"
                          onClick={() => handleEditClick(product)}
                        >
                          <span className="material-icons text-sm">edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary"
                          onClick={() => handleRestockClick(product)}
                        >
                          <span className="material-icons text-sm">refresh</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
