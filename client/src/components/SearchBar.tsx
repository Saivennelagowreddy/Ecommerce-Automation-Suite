import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/hooks/useOrders";
import { useClients } from "@/hooks/useClients";
import { useInventory } from "@/hooks/useInventory";

// Simple debounce implementation within the component
function useCustomDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const debouncedSearchTerm = useCustomDebounce(searchTerm, 300);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  const { orders } = useOrders();
  const { clients } = useClients();
  const { inventory } = useInventory();

  // Filter results based on search term
  const filteredOrders = orders?.filter(order => 
    order.orderNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ).slice(0, 3) || [];

  const filteredClients = clients?.filter(client => 
    client.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    client.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ).slice(0, 3) || [];

  const filteredProducts = inventory?.filter(product => 
    product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
    product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  ).slice(0, 3) || [];

  const hasResults = filteredOrders.length > 0 || filteredClients.length > 0 || filteredProducts.length > 0;

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setIsSearchResultsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show/hide search results based on search term
  useEffect(() => {
    if (debouncedSearchTerm.length > 1) {
      setIsSearchResultsOpen(true);
    } else {
      setIsSearchResultsOpen(false);
    }
  }, [debouncedSearchTerm]);

  const handleItemClick = () => {
    setIsSearchResultsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full max-w-md" ref={searchResultsRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search orders, clients, products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full bg-white/20 text-white placeholder:text-white/60 border-white/30"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
          <span className="material-icons text-sm">search</span>
        </span>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-white hover:text-white/70"
            onClick={() => setSearchTerm("")}
          >
            <span className="material-icons text-sm">close</span>
          </Button>
        )}
      </div>

      {isSearchResultsOpen && debouncedSearchTerm.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-50 overflow-hidden">
          {!hasResults ? (
            <div className="p-4 text-center text-neutral-500">
              No results found for "{debouncedSearchTerm}"
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredOrders.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs uppercase font-medium text-neutral-500 px-2 pb-1">Orders</h3>
                  {filteredOrders.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`} onClick={handleItemClick}>
                      <div className="px-2 py-1.5 hover:bg-neutral-100 rounded cursor-pointer">
                        <div className="flex items-center">
                          <span className="material-icons text-neutral-400 mr-2 text-sm">receipt</span>
                          <div>
                            <div className="font-medium">#{order.orderNumber}</div>
                            <div className="text-xs text-neutral-500">
                              Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {filteredClients.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs uppercase font-medium text-neutral-500 px-2 pb-1">Clients</h3>
                  {filteredClients.map((client) => (
                    <Link key={client.id} href="/clients" onClick={handleItemClick}>
                      <div className="px-2 py-1.5 hover:bg-neutral-100 rounded cursor-pointer">
                        <div className="flex items-center">
                          <span className="material-icons text-neutral-400 mr-2 text-sm">person</span>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-neutral-500">{client.email}</div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {filteredProducts.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs uppercase font-medium text-neutral-500 px-2 pb-1">Products</h3>
                  {filteredProducts.map((product) => (
                    <Link key={product.id} href="/inventory" onClick={handleItemClick}>
                      <div className="px-2 py-1.5 hover:bg-neutral-100 rounded cursor-pointer">
                        <div className="flex items-center">
                          <span className="material-icons text-neutral-400 mr-2 text-sm">inventory_2</span>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-neutral-500">
                              ${product.price.toFixed(2)} - Stock: {product.stockQuantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}