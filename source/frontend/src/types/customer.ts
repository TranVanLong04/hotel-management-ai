export interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  identity_number: string | null;
  date_of_birth: string | null; // ISO date YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateCustomerProfileDto = Partial<
  Pick<CustomerProfile, 'full_name' | 'phone' | 'identity_number' | 'date_of_birth' | 'gender' | 'address'>
>;
