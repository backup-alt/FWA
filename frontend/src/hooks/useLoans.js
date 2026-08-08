import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loans } from '@/api';

const DEFAULT_PAGE_SIZE = 25;

function extractData(response) {
  if (Array.isArray(response)) return { data: response, total: response.length, hasMore: false, page: 1 };
  if (response && Array.isArray(response.data)) {
    return {
      data: response.data,
      total: response.total ?? response.data.length,
      hasMore: Boolean(response.hasMore),
      page: response.page ?? 1,
      totalPages: response.totalPages,
    };
  }
  return { data: [], total: 0, hasMore: false, page: 1 };
}

export function useLoans(filters = {}) {
  return useQuery({
    queryKey: ['loans', { ...filters, page: 1, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: async () => {
      const res = await Loans.list({ ...filters, page: 1, pageSize: DEFAULT_PAGE_SIZE });
      return extractData(res);
    },
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
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
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
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
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
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
    },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sNo, data }) => Loans.recordPayment(id, sNo, data),
    onSuccess: (updatedLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
      qc.setQueryData(['loan', updatedLoan._id], updatedLoan);
    },
  });
}

export function usePendingDues() {
  return useQuery({
    queryKey: ['pendingDues', { page: 1, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: async () => {
      const res = await Loans.pendingDues({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
      return extractData(res);
    },
  });
}

export function useLoansSummary(filters = {}) {
  return useQuery({
    queryKey: ['loans-summary', filters],
    queryFn: () => Loans.summary(filters),
  });
}

export function usePendingDuesSummary() {
  return useQuery({
    queryKey: ['pendingDues-summary'],
    queryFn: () => Loans.pendingDuesSummary(),
  });
}

export function useInfinitePendingDues(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['pendingDues-infinite', filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await Loans.pendingDues({ ...filters, page: pageParam, pageSize: DEFAULT_PAGE_SIZE });
      return extractData(res);
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useCloseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => Loans.closeLoan(id, data),
    onSuccess: (updatedLoan) => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['pendingDues'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
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
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
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
      qc.invalidateQueries({ queryKey: ['pendingDues-infinite'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
      qc.invalidateQueries({ queryKey: ['loans-summary'] });
      qc.invalidateQueries({ queryKey: ['pendingDues-summary'] });
      qc.setQueryData(['loan', newLoan._id], newLoan);
    },
  });
}
