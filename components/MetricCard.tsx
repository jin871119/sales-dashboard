import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const colorClasses = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
};

const bgColorClasses = {
  blue: "bg-blue-50",
  green: "bg-green-50",
  purple: "bg-purple-50",
  orange: "bg-orange-50",
  red: "bg-red-50",
  indigo: "bg-indigo-50",
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  trend,
}: MetricCardProps) {
  return (
    <div className={`${bgColorClasses[color]} border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`${colorClasses[color]} p-1.5 sm:p-2 rounded-lg text-white shadow-md`}>
          <div className="w-4 h-4 sm:w-5 sm:h-5">
            {icon}
          </div>
        </div>
        {trend && (
          <div
            className={`text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
              trend.isPositive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span className="hidden sm:inline">{trend.value}</span>
            <span className="sm:hidden text-[10px]">{trend.value.length > 8 ? trend.value.substring(0, 6) + '...' : trend.value}</span>
          </div>
        )}
      </div>
      
      <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium mb-1">{title}</h3>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 break-words">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      
      {subtitle && (
        <p className="text-[10px] sm:text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}


