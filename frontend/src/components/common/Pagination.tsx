import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-xs text-slate-500">
        {totalElements} {totalElements === 1 ? 'record' : 'records'}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-slate-500">
        Page {page + 1} of {totalPages} · {totalElements} records
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeft className="h-4 w-4" />}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
