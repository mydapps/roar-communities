import { useState, useEffect } from 'react';

interface FilCDNSyncDetails {
  isPending: boolean;
  isUploading: boolean;
  isUploaded: boolean;
  isFailed: boolean;
  isSkipped: boolean;
}

interface FilCDNStatusData {
  postId: number;
  postCode: string;
  title: string;
  filcdnStatus: string;
  filcdnUrl: string;
  createdOn: string;
  isSynced: boolean;
  syncDetails: FilCDNSyncDetails;
}

interface FilCDNStatusResponse {
  success: boolean;
  data: FilCDNStatusData;
}

interface UseFilCDNStatusReturn {
  data: FilCDNStatusData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFilCDNStatus = (postCode: string | undefined): UseFilCDNStatusReturn => {
  const [data, setData] = useState<FilCDNStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilCDNStatus = async () => {
    if (!postCode) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/filcdn-status/${postCode}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FilCDNStatusResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching FilCDN status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch FilCDN status');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilCDNStatus();
  }, [postCode]);

  const refetch = () => {
    fetchFilCDNStatus();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}; 