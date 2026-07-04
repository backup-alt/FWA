import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function PaymentTrendChart({ loans = [] }) {
  const monthlyData = {};

  loans.forEach(loan => {
    loan.installments?.forEach(installment => {
      if (installment.status === 'Paid' && installment.dateReceived) {
        const date = new Date(installment.dateReceived);
        if (isNaN(date.getTime())) return;
        const month = format(date, 'MMM yyyy');
        monthlyData[month] = (monthlyData[month] || 0) + (installment.amountReceived || 0);
      }
    });
  });

  const sortedMonths = Object.keys(monthlyData)
    .sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
      return dateA - dateB;
    })
    .slice(-12);

  const chartData = sortedMonths.map(month => ({
    month,
    collected: monthlyData[month] || 0,
  }));

  return (
    <Card padding="" className="h-full">
      <CardHeader className="px-5 pt-5 mb-0" title="Monthly Collections" subtitle="Last 12 months" />
      <CardContent className="p-5">
        {chartData.length === 0 ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No payment data available
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={value => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={value => [`₹${value.toLocaleString('en-IN')}`, 'Collected']}
                  contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#0284c7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
