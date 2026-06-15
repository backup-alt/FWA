import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  Bikes: '#0284c7',
  Cars: '#16a34a',
};

export function VehicleTypeChart({ loans = [] }) {
  const bikeLoans = loans.filter(loan => loan.vehicleType === 'Bike').length;
  const carLoans = loans.filter(loan => loan.vehicleType === 'Car').length;
  const total = loans.length;

  const data = [
    { name: 'Bikes', value: bikeLoans, fill: COLORS.Bikes },
    { name: 'Cars', value: carLoans, fill: COLORS.Cars },
  ].filter(item => item.value > 0);

  return (
    <Card padding="" className="h-full">
      <CardHeader
        className="px-5 pt-5 mb-0"
        title="Vehicle Distribution"
        subtitle={`${total} total loan${total === 1 ? '' : 's'}`}
      />
      <CardContent className="p-5">
        {total === 0 ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No vehicle data available
          </div>
        ) : (
          <div className="grid min-h-72 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_160px] lg:items-center">
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                  >
                    {data.map(entry => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} loan${value === 1 ? '' : 's'}`, name]}
                    contentStyle={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['Bikes', bikeLoans],
                ['Cars', carLoans],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[label] }} />
                    <span>{label}</span>
                  </div>
                  <span className="font-semibold text-gray-950 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
