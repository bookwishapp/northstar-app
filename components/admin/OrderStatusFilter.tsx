'use client';

import { useRouter } from 'next/navigation';

interface OrderStatusFilterProps {
  currentStatus?: string;
}

export default function OrderStatusFilter({ currentStatus }: OrderStatusFilterProps) {
  const router = useRouter();

  const statuses = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'pending_claim', label: 'Pending Claim' },
    { value: 'pending_generation', label: 'Pending Generation' },
    { value: 'pending_pdf', label: 'Pending PDF' },
    { value: 'pending_delivery', label: 'Pending Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
  ];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams();
    if (e.target.value) params.set('status', e.target.value);
    router.push(`/admin/orders${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <select
      value={currentStatus || ''}
      onChange={handleStatusChange}
      className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
    >
      {statuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}