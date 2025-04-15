import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProfilePage = () => {
  const { user } = useAuth();
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-medium mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-medium">{user.name}</h2>
                <p className="text-neutral-500">{user.email}</p>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-neutral-500">Username</p>
                  <p className="font-medium">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Full Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Account Status</p>
                  <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50 border-green-200">
                    Active
                  </Badge>
                </div>
                
                <Button className="w-full" variant="outline">Edit Profile</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded">
                    <span className="material-icons">inventory_2</span>
                  </div>
                  <div>
                    <p className="font-medium">Product Updated</p>
                    <p className="text-sm text-neutral-500">You updated product "Shirt" information</p>
                    <p className="text-xs text-neutral-400 mt-1">Just now</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 text-purple-600 p-2 rounded">
                    <span className="material-icons">login</span>
                  </div>
                  <div>
                    <p className="font-medium">System Login</p>
                    <p className="text-sm text-neutral-500">You logged in to the system</p>
                    <p className="text-xs text-neutral-400 mt-1">Today at {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 text-green-600 p-2 rounded">
                    <span className="material-icons">shopping_cart</span>
                  </div>
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-sm text-neutral-500">You created a new order #ORD-2305</p>
                    <p className="text-xs text-neutral-400 mt-1">Yesterday</p>
                  </div>
                </div>
              </div>
              
              <Button variant="link" className="mt-4 px-0">View All Activity</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-neutral-500">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-neutral-500">Add an extra layer of security</p>
                  </div>
                  <Button>Enable</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;