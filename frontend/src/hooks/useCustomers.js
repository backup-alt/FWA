import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customers } from '@/api';

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

export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ['customers', { ...params, page: 1, pageSize: DEFAULT_PAGE_SIZE }],
    queryFn: async () => {
      const res = await Customers.list({ ...params, page: 1, pageSize: DEFAULT_PAGE_SIZE });
      return extractData(res);
    },
  });
}

export function useInfiniteCustomers(params = {}) {
  return useInfiniteQuery({
    queryKey: ['customers-infinite', params],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await Customers.list({ ...params, page: pageParam, pageSize: DEFAULT_PAGE_SIZE });
      return extractData(res);
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => Customers.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => Customers.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => Customers.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => Customers.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customers-infinite'] });
    },
  });
}
