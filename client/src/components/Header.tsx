import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import SearchBar from "./SearchBar";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-primary text-white shadow-md flex justify-between items-center py-2 px-4 h-16 z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="mr-4 focus:outline-none lg:hidden" 
          aria-label="Menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <h1 className="text-xl font-medium">E-Commerce Automation Suite</h1>
      </div>
      
      <div className="hidden md:block mx-4 flex-1 max-w-md">
        <SearchBar />
      </div>
      
      <div className="flex items-center">
        <div className="mr-4 relative">
          <button 
            className="rounded-full p-2 hover:bg-primary-dark focus:outline-none" 
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <span className="material-icons">notifications</span>
            <span className="absolute bg-error text-white text-xs rounded-full -top-1 -right-1 w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
              <div className="py-2 px-4 bg-primary text-white">
                <h3 className="text-sm font-medium">Notifications</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start">
                    <span className="material-icons text-primary mr-3">shopping_cart</span>
                    <div>
                      <p className="text-sm font-medium">New Order Received</p>
                      <p className="text-xs text-gray-500">Order #ORD-2305 from John Smith</p>
                      <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start">
                    <span className="material-icons text-warning mr-3">inventory_2</span>
                    <div>
                      <p className="text-sm font-medium">Low Stock Alert</p>
                      <p className="text-xs text-gray-500">Wireless Headphones (5 remaining)</p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start">
                    <span className="material-icons text-success mr-3">people</span>
                    <div>
                      <p className="text-sm font-medium">New Client Registration</p>
                      <p className="text-xs text-gray-500">Sarah Johnson joined</p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="py-2 text-center border-t border-gray-100">
                <button className="text-primary text-sm hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center outline-none">
            <div className="w-8 h-8 rounded-full bg-neutral-300 mr-2 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary-dark flex items-center justify-center text-white text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <span className="hidden md:inline">{user?.name || 'Admin User'}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-4 py-3">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <span className="material-icons text-gray-500 mr-2 text-sm">person</span>
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <span className="material-icons text-gray-500 mr-2 text-sm">settings</span>
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Logging out...</span>
                </>
              ) : (
                <>
                  <span className="material-icons mr-2 text-sm">logout</span>
                  <span>Log Out</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
