import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/api';
import { clsx } from 'clsx';

export function PaymentModal({ isOpen, onClose, installment, loan }) {
  if (!installment) return null;

  const history = installment.paymentHistory || [];
  const adjustments = (loan?.installments || [])
    .filter(i => i.adjustment !== 0 && i.sNo <= installment.sNo)
    .map(i => ({
      sNo: i.sNo,
      adjustment: i.adjustment,
      dueDate: i.dueDate,
    }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment History - Installment #${installment.sNo}`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Due Amount</p>
            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(installment.dueAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Amount Received</p>
            <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(installment.amountReceived)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <span className="font-medium capitalize">{installment.status.toLowerCase()}</span>
          </div>
        </div>

        {history.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Records</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Collector</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(record.amount)}</TableCell>
                    <TableCell>{record.collector || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {adjustments.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Adjustments Applied</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installment</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map(adj => (
                  <TableRow key={adj.sNo}>
                    <TableCell>#{adj.sNo}</TableCell>
                    <TableCell className={clsx('font-medium', adj.adjustment > 0 ? 'text-red-600' : 'text-green-600')}>
                      {adj.adjustment > 0 ? '+' : ''}{formatCurrency(adj.adjustment)}
                    </TableCell>
                    <TableCell>{formatDate(adj.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {(history.length === 0 && adjustments.length === 0) && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No payment history available</p>
        )}
      </div>
    </Modal>
  );
}
