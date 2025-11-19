import type { Sale } from "@/types/dashboard";

interface RecentSalesProps {
  sales: Sale[];
}

const statusColors = {
  완료: "bg-green-100 text-green-800",
  처리중: "bg-yellow-100 text-yellow-800",
  대기: "bg-gray-100 text-gray-800",
};

export default function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">최근 판매 내역</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                고객명
              </th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                상품
              </th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                금액
              </th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                상태
              </th>
              <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                날짜
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {sale.customer}
                </td>
                <td className="py-3 px-4 text-gray-600">{sale.product}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">
                  {sale.amount}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[sale.status]
                    }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{sale.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

