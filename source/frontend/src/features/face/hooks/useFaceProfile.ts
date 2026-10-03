import { useState, useEffect, useCallback } from 'react';
import { faceApi } from '@/api/face.api';
import type { FaceProfile } from '@/types/face';
import { logger } from '@/utils/logger';

/**
 * Custom hook tải và quản lý hồ sơ khuôn mặt khách hàng
 */
export function useFaceProfile() {
  const [profile, setProfile] = useState<FaceProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await faceApi.getMyProfile();
      setProfile(data);
    } catch (err: unknown) {
      logger.error('Lỗi khi tải hồ sơ khuôn mặt:', err);
      setError('Không thể tải thông tin hồ sơ khuôn mặt');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
