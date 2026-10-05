import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getMyProfileApi, updateMyProfileApi } from '@/api/customer.api';
import type { CustomerProfile, UpdateCustomerProfileDto } from '@/types';
import axios from 'axios';

/**
 * Custom hook quản lý trạng thái và thao tác với hồ sơ cá nhân của khách hàng
 * Tham chiếu: docs/08-features/02-customer-profile.md
 */
export function useProfile() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyProfileApi();
      setProfile(data);
    } catch (err: unknown) {
      let message = 'Không thể tải thông tin hồ sơ';
      if (axios.isAxiosError(err)) {
        message =
          (err.response?.data as { error?: { message?: string } })?.error?.message ?? message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = async (data: UpdateCustomerProfileDto): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const updated = await updateMyProfileApi(data);
      setProfile(updated);
      toast.success('Cập nhật hồ sơ thành công');
      return true;
    } catch (err: unknown) {
      let message = 'Cập nhật hồ sơ thất bại';
      if (axios.isAxiosError(err)) {
        message =
          (err.response?.data as { error?: { message?: string } })?.error?.message ?? message;
      }
      toast.error(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    profile,
    isLoading,
    isSubmitting,
    error,
    update,
    refetch: fetchProfile,
  };
}
