import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ClientActivityItem } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface ClientActivityProps {
  title?: string;
  limit?: number;
  showViewAllLink?: boolean;
}

const ClientActivity = ({ 
  title = "Client Activity", 
  limit = 5, 
  showViewAllLink = true 
}: ClientActivityProps) => {
  const { data: activities, isLoading } = useQuery<ClientActivityItem[]>({
    queryKey: ['/api/clients/activity'],
  });

  // Slice to show only the specified number of activities
  const displayActivities = activities ? activities.slice(0, limit) : [];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {showViewAllLink && (
          <Link href="/clients">
            <a className="text-primary text-sm hover:underline">View All Clients</a>
          </Link>
        )}
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            <span className="material-icons text-3xl text-neutral-300 mb-2">people</span>
            <p>No client activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start pb-3 border-b border-neutral-100">
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 overflow-hidden mr-3">
                  {activity.client.avatarUrl ? (
                    <img 
                      src={activity.client.avatarUrl} 
                      alt={`${activity.client.name} avatar`} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-sm">
                      {activity.client.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center">
                    <p className="font-medium text-sm">{activity.client.name}</p>
                    <span className="text-neutral-400 text-xs ml-2">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {activity.description}
                    {activity.relatedId && (
                      <Link href={`/orders/${activity.relatedId}`}>
                        <a className="text-primary ml-1">#{activity.relatedId}</a>
                      </Link>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientActivity;
