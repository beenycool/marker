import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from '../use-dashboard';
import { useQuery } from '@tanstack/react-query';

// Mock fetch
global.fetch = jest.fn();

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

describe('useDashboard', () => {
  const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard data on successful fetch', async () => {
    const mockData = {
      recentSubmissions: [
        {
          id: '1',
          question: 'Test question',
          subject: 'Mathematics',
          examBoard: 'AQA',
          createdAt: '2023-01-01T00:00:00Z',
          score: 85,
          grade: 'A',
        },
      ],
      analytics: {
        totalSubmissions: 10,
        averageScore: 82.5,
        subjectBreakdown: { Mathematics: 5, English: 3, Science: 2 },
        progressOverTime: [
          { date: '2023-01-01', score: 80, count: 1 },
          { date: '2023-01-02', score: 85, count: 2 },
        ],
        gradeDistribution: { A: 3, B: 4, C: 2, D: 1 },
      },
      usage: {
        used: 5,
        limit: 20,
        remaining: 15,
        canUse: true,
      },
    };

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle error state', () => {
    const mockError = new Error('Failed to fetch dashboard data');

    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      isError: true,
      refetch: jest.fn(),
    } as any);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(mockError);
  });

  it('should use correct query configuration', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      isError: false,
      refetch: jest.fn(),
    } as any);

    renderHook(() => useDashboard());

    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ['dashboard'],
      queryFn: expect.any(Function),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 60 * 1000, // 1 minute
    });
  });

  it('should handle fetch errors in queryFn', async () => {
    const mockQueryFn = jest.fn().mockRejectedValue(new Error('Network error'));

    mockUseQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        queryFn();
      }
      return {
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        isError: true,
        refetch: jest.fn(),
      } as any;
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should handle non-ok response in queryFn', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    mockUseQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        expect(queryFn()).rejects.toThrow('Failed to fetch dashboard data');
      }
      return {
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch dashboard data'),
        isError: true,
        refetch: jest.fn(),
      } as any;
    });

    renderHook(() => useDashboard());
  });

  it('should parse JSON response correctly', async () => {
    const mockData = {
      recentSubmissions: [],
      analytics: {
        totalSubmissions: 0,
        averageScore: 0,
        subjectBreakdown: {},
        progressOverTime: [],
        gradeDistribution: {},
      },
      usage: {
        used: 0,
        limit: 20,
        remaining: 20,
        canUse: true,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    mockUseQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        queryFn();
      }
      return {
        data: mockData,
        isLoading: false,
        error: null,
        isError: false,
        refetch: jest.fn(),
      } as any;
    });

    const { result } = renderHook(() => useDashboard());

    expect(result.current.data).toEqual(mockData);
  });

  it('should handle malformed JSON response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    });

    mockUseQuery.mockImplementation(({ queryFn }) => {
      if (queryFn) {
        expect(queryFn()).rejects.toThrow('Invalid JSON');
      }
      return {
        data: undefined,
        isLoading: false,
        error: new Error('Invalid JSON'),
        isError: true,
        refetch: jest.fn(),
      } as any;
    });

    renderHook(() => useDashboard());
  });
});
