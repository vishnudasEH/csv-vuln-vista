import { useState, useMemo } from 'react';

export interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export const usePagination = <T>(
  data: T[], 
  options: PaginationOptions = {}
) => {
  const { pageSize = 100, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const pagination = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedData = data.slice(startIndex, endIndex);

    // Reset to first page if current page is out of bounds
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }

    return {
      currentPage: Math.min(currentPage, Math.max(1, totalPages)),
      totalPages,
      totalItems,
      pageSize,
      startIndex,
      endIndex,
      paginatedData,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [data, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (pagination.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetPage = () => {
    setCurrentPage(1);
  };

  return {
    ...pagination,
    goToPage,
    goToNextPage,
    goToPrevPage,
    resetPage,
  };
};