import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loans } from '@/api';

export function useLoans(filters = {}) {
  return useQuery({
    queryKey: ['loans', filters],
    queryFn: () => Loans.list(filters),
  });
}

export function useLoan(id) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: () => Loans.get(id),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => Loans.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
    },
  });
}

export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => Loans.update(id, data),
    onSuccess: (updatedLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.setQueryData(['loan', updatedLoan._id], updatedLoan);
    },
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => Loans.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sNo, data }) => Loans.recordPayment(id, sNo, data),
    onSuccess: (updatedLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.setQueryData(['loan', updatedLoan._id], updatedLoan);
    },
  });
}

export function usePendingDues() {
  return useQuery({
    queryKey: ['pendingDues'],
    queryFn: () => Loans.pendingDues(),
  });
}

export function useCloseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => Loans.closeLoan(id, data),
    onSuccess: (updatedLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.setQueryData(['loan', updatedLoan._id], updatedLoan);
    },
  });
}

export function useRestructureLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => Loans.restructureLoan(id, data),
    onSuccess: (updatedLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.setQueryData(['loan', updatedLoan._id], updatedLoan);
    },
  });
}

export function useRenewLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => Loans.renewLoan(id, data),
    onSuccess: (newLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.setQueryData(['loan', newLoan._id], newLoan);
    },
  });
}