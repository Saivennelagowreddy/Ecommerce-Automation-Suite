import { useState } from "react";
import { useClients, useClientActivities } from "@/hooks/useClients";
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
import { insertClientSchema } from "@shared/schema";
import ClientActivity from "@/components/ClientActivity";

const clientSchema = insertClientSchema.extend({
  // Add additional validation rules
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
});

const Clients = () => {
  const { clients, isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const addClientMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientSchema>) => {
      await apiRequest('POST', '/api/clients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients/activity'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Client Added",
        description: "The client has been added successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Add Failed",
        description: error.message || "There was an error adding the client.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    addClientMutation.mutate({
      ...data,
      lastActive: new Date(),
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">Clients</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manage Clients</CardTitle>
          <CardDescription>View and manage client information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search clients by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="md:w-auto">
                  <span className="material-icons mr-2 text-sm">add</span>
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client details below to add them to your system.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={addClientMutation.isPending}
                      >
                        {addClientMutation.isPending ? 'Saving...' : 'Add Client'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Client List</h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !clients || clients.length === 0 ? (
                <div className="text-center py-4 text-neutral-500">
                  <span className="material-icons text-3xl text-neutral-300 mb-2">people_off</span>
                  <p>No clients found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div key={client.id} className="bg-white p-4 rounded-lg shadow flex items-center">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0 overflow-hidden mr-3">
                        {client.avatarUrl ? (
                          <img 
                            src={client.avatarUrl} 
                            alt={`${client.name} avatar`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                            {client.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{client.name}</h3>
                        <p className="text-sm text-neutral-500">{client.email}</p>
                        {client.phone && <p className="text-sm text-neutral-500">{client.phone}</p>}
                      </div>
                      <Button variant="ghost" size="icon">
                        <span className="material-icons">more_vert</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
              <ClientActivity title="" showViewAllLink={false} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Clients;
