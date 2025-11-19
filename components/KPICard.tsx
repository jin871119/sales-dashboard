import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
}

const colorClasses = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
};

export default function KPICard({
  title,
  value,
  change,
  trend,
  icon,
  color,
}: KPICardProps) {
  const isPositive = trend === "up";
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`${colorClasses[color]} p-3 rounded-lg text-white`}>
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}


