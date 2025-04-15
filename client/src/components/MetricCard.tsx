interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
}

const MetricCard = ({ title, value, icon, iconBgColor, trend }: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`rounded-full ${iconBgColor} p-3 mr-4`}>
        <span className="material-icons text-primary">{icon}</span>
      </div>
      <div>
        <h3 className="text-neutral-500 text-sm">{title}</h3>
        <div className="flex items-center">
          <p className="text-2xl font-medium">{value}</p>
          {trend && (
            <span 
              className={`ml-2 text-xs ${
                trend.isPositive 
                  ? 'bg-success bg-opacity-10 text-success' 
                  : 'bg-error bg-opacity-10 text-error'
              } py-1 px-2 rounded-full flex items-center`}
            >
              <span className="material-icons text-xs mr-1">
                {trend.isPositive ? 'arrow_upward' : 'arrow_downward'}
              </span>
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
