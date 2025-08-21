import { useMemo } from 'react';

interface PaginationOptions {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasNext: boolean;
  hasPrev: boolean;
  pages: (number | 'ellipsis')[];
}

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

export const usePagination = ({
  currentPage,
  totalCount,
  pageSize,
  siblingCount = 1,
}: PaginationOptions): PaginationResult => {
  const pagination = useMemo(() => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalCount - 1);

    // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
    const totalPageNumbers = siblingCount + 5;

    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPageCount]
    */
    if (totalPageNumbers >= totalPages) {
      return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        pages: range(1, totalPages),
      };
    }

    /*
      Calculate left and right sibling index and make sure they are within range 1 and totalPageCount
    */
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    /*
      We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the boundaries i.e 1 and totalPageCount. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPageCount - 1
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    /*
      Case 2: No left dots to show, but rights dots to be shown
    */
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);

      return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        pages: [...leftRange, 'ellipsis', totalPages],
      };
    }

    /*
      Case 3: No right dots to show, but left dots to be shown
    */
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);

      return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        pages: [firstPageIndex, 'ellipsis', ...rightRange],
      };
    }

    /*
      Case 4: Both left and right dots to be shown
    */
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        pages: [firstPageIndex, 'ellipsis', ...middleRange, 'ellipsis', lastPageIndex],
      };
    }

    return {
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      pages: [],
    };
  }, [currentPage, totalCount, pageSize, siblingCount]);

  return pagination;
};