import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/api';
import { clsx } from 'clsx';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const statStyles = {
  primary: {
    icon: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    accent: 'bg-sky-500',
  },
  danger: {
    icon: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    accent: 'bg-red-500',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    accent: 'bg-emerald-500',
  },
  info: {
    icon: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    accent: 'bg-indigo-500',
  },
  gray: {
    icon: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    accent: 'bg-slate-400',
  },
};

export function PortfolioSummary({ loans = [] }) {
  const activeLoans = loans.filter(loan => loan.status === 'Active');
  const completedLoans = loans.filter(loan => loan.status === 'Completed');

  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + (loan.outstandingPrincipal || 0), 0);
  const totalOverdue = activeLoans.reduce((sum, loan) => {
    const overdue = loan.installments
      ?.filter(installment => installment.status === 'Overdue' || installment.status === 'Partial')
      .reduce((innerSum, installment) => (
        innerSum + (installment.dueAmount - (installment.amountReceived || 0) + (installment.adjustment || 0))
      ), 0) || 0;

    return sum + overdue;
  }, 0);
  const totalCollected = loans.reduce((sum, loan) => sum + (loan.totalPaid || 0), 0);

  const stats = [
    { label: 'Total Outstanding', value: formatCurrency(totalOutstanding), color: 'primary', icon: CurrencyRupeeIcon },
    { label: 'Overdue Amount', value: formatCurrency(totalOverdue), color: 'danger', icon: ExclamationTriangleIcon },
    { label: 'Total Collected', value: formatCurrency(totalCollected), color: 'success', icon: BanknotesIcon },
    { label: 'Active Loans', value: activeLoans.length, color: 'info', icon: ClipboardDocumentListIcon },
    { label: 'Completed Loans', value: completedLoans.length, color: 'success', icon: CheckCircleIcon },
    { label: 'Total Clients', value: loans.length, color: 'gray', icon: UserGroupIcon },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const style = statStyles[stat.color];

        return (
          <Card key={stat.label} padding="" className="overflow-hidden">
            <CardContent className="relative min-h-32 p-5">
              <div className={clsx('absolute inset-x-0 top-0 h-1', style.accent)} />
              <div className="flex h-full items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-normal text-gray-950 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', style.icon)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
