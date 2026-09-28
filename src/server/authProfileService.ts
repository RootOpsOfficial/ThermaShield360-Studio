import { supabase } from './supabase.js';

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'worker' | 'municipal' | 'healthcare' | 'disaster_management';
  approval_status: 'pending' | 'approved' | 'rejected' | 'disabled';
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnboardingRecord {
  id?: string;
  user_id: string;
  city?: string;
  state?: string;
  country?: string;
  area_type?: string;
  work_environment?: string;
  occupation?: string;
  outdoor_exposure?: string;
  age_group?: string;
  cooling_access?: string;
  organization?: string;
  department?: string;
  operational_area?: string;
  facility_type?: string;
  facility_capacity?: string;
  responsibilities?: string;
  monitoring_preferences?: string[];
  alert_preferences?: string[];
  work_hours?: string;
  water_access?: string;
  rest_area_access?: string;
  physical_demand?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstitutionalRequestRecord {
  id: string;
  full_name: string;
  email: string;
  requested_role: 'municipal' | 'healthcare' | 'disaster_management';
  organization: string;
  department: string;
  city_district: string;
  contact_phone?: string;
  official_id_reference?: string;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalConfigRecord {
  role: 'municipal' | 'healthcare' | 'disaster_management';
  role_label: string;
  authorized_approver_emails: string[];
  allowed_email_domains: string[];
  auto_approve_domains: boolean;
  notification_email: string;
  updated_at: string;
}

/**
 * Check if an email has an approved institutional access request in the database.
 * Uses strict lowercase normalized comparison.
 */
export async function getApprovedInstitutionalRequestForEmail(email: string): Promise<InstitutionalRequestRecord | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  try {
    const { data, error } = await supabase
      .from('institutional_access_requests')
      .select('*')
      .eq('email', normalized)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as InstitutionalRequestRecord;
    }
  } catch (err: any) {
    console.error('[authProfileService] Error checking approved request:', err?.message || err);
  }

  return null;
}

/**
 * Fetch profile from the authoritative Supabase 'profiles' table.
 * If user exists in auth but has an approved institutional request not yet synced to profile,
 * automatically upgrades profile to the approved role.
 */
export async function getProfile(userId: string, email?: string): Promise<ProfileRecord | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[authProfileService] getProfile DB error:', error.message);
      return null;
    }

    if (data) {
      const profile = data as ProfileRecord;

      // Check if user has an approved institutional request that should elevate their profile
      const userEmail = email || profile.email;
      if (userEmail && (profile.role === 'citizen' || profile.role === 'worker' || profile.approval_status === 'pending')) {
        const approvedReq = await getApprovedInstitutionalRequestForEmail(userEmail);
        if (approvedReq) {
          // Promote profile in database to approved institutional role
          const { data: updatedData } = await supabase
            .from('profiles')
            .update({
              role: approvedReq.requested_role,
              approval_status: 'approved',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .maybeSingle();

          if (updatedData) {
            return updatedData as ProfileRecord;
          }
        }
      }

      return profile;
    }
  } catch (err: any) {
    console.error('[authProfileService] getProfile unexpected error:', err?.message || err);
  }

  return null;
}

/**
 * Creates or updates profile in 'profiles' table.
 * Enforces security invariant:
 * Users CANNOT self-assign institutional roles ('municipal', 'healthcare', 'disaster_management').
 * Institutional roles are ONLY permitted if an approved institutional request exists in the database.
 */
export async function upsertProfile(
  authenticatedUserId: string,
  authenticatedUserEmail: string,
  profileData: {
    full_name?: string;
    role?: 'citizen' | 'worker' | 'municipal' | 'healthcare' | 'disaster_management';
    onboarding_completed?: boolean;
  }
): Promise<{ success: boolean; data?: ProfileRecord; error?: string }> {
  try {
    const existing = await getProfile(authenticatedUserId, authenticatedUserEmail);
    const now = new Date().toISOString();

    // Determine safe, authorized role
    let authorizedRole: 'citizen' | 'worker' | 'municipal' | 'healthcare' | 'disaster_management' = 'citizen';
    let authorizedApproval: 'pending' | 'approved' | 'rejected' | 'disabled' = 'approved';

    // Check if user has an approved institutional request
    const approvedReq = await getApprovedInstitutionalRequestForEmail(authenticatedUserEmail);

    if (approvedReq) {
      authorizedRole = approvedReq.requested_role;
      authorizedApproval = 'approved';
    } else if (existing && (existing.role === 'municipal' || existing.role === 'healthcare' || existing.role === 'disaster_management')) {
      // Retain existing institutional role and status
      authorizedRole = existing.role;
      authorizedApproval = existing.approval_status;
    } else if (profileData.role === 'worker') {
      // Public self-service role
      authorizedRole = 'worker';
      authorizedApproval = 'approved';
    } else {
      // Default public self-service role
      authorizedRole = 'citizen';
      authorizedApproval = 'approved';
    }

    const record: ProfileRecord = {
      id: authenticatedUserId,
      email: authenticatedUserEmail.toLowerCase().trim(),
      full_name: (profileData.full_name || existing?.full_name || 'User').trim(),
      role: authorizedRole,
      approval_status: authorizedApproval,
      onboarding_completed: profileData.onboarding_completed !== undefined
        ? profileData.onboarding_completed
        : (existing?.onboarding_completed ?? false),
      created_at: existing?.created_at || now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(record, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[authProfileService] upsertProfile error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ProfileRecord };
  } catch (err: any) {
    console.error('[authProfileService] upsertProfile error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error upserting profile' };
  }
}

/**
 * Save onboarding data and mark profile onboarding_completed = true in the database.
 * Strictly uses authenticatedUserId.
 */
export async function saveOnboarding(
  authenticatedUserId: string,
  onboarding: Omit<OnboardingRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: OnboardingRecord; error?: string }> {
  try {
    const now = new Date().toISOString();
    const record: OnboardingRecord = {
      ...onboarding,
      user_id: authenticatedUserId,
      onboarding_completed: true,
      updated_at: now,
      created_at: now,
    };

    const { data, error } = await supabase
      .from('user_onboarding')
      .upsert(record, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[authProfileService] saveOnboarding error:', error.message);
      return { success: false, error: error.message };
    }

    // Update profile onboarding_completed flag in profiles table
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true, updated_at: now })
      .eq('id', authenticatedUserId);

    return { success: true, data: data as OnboardingRecord };
  } catch (err: any) {
    console.error('[authProfileService] saveOnboarding error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error saving onboarding' };
  }
}

/**
 * Fetch onboarding data by authenticated user ID.
 */
export async function getOnboarding(authenticatedUserId: string): Promise<OnboardingRecord | null> {
  try {
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .maybeSingle();

    if (error) {
      console.error('[authProfileService] getOnboarding error:', error.message);
      return null;
    }

    return (data as OnboardingRecord) || null;
  } catch (err: any) {
    console.error('[authProfileService] getOnboarding error:', err?.message || err);
    return null;
  }
}

/**
 * Submit an institutional access request.
 * - Validates required fields
 * - Normalizes email (lowercase, trim)
 * - Checks for duplicate active pending requests
 * - Never grants access automatically
 * - Initial status is ALWAYS 'pending'
 */
export async function submitInstitutionalRequest(
  request: Omit<InstitutionalRequestRecord, 'id' | 'status' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: InstitutionalRequestRecord; error?: string }> {
  const normalizedEmail = request.email.trim().toLowerCase();

  // Check if a pending request already exists for this email and requested role
  try {
    const { data: existingPending, error: checkError } = await supabase
      .from('institutional_access_requests')
      .select('id, created_at')
      .eq('email', normalizedEmail)
      .eq('requested_role', request.requested_role)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (!checkError && existingPending) {
      return {
        success: false,
        error: `A pending access request for ${request.requested_role} already exists for ${normalizedEmail}. Please wait for administrator review.`,
      };
    }
  } catch (err: any) {
    console.warn('[authProfileService] check duplicate request warning:', err?.message || err);
  }

  const id = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const record: InstitutionalRequestRecord = {
    ...request,
    id,
    email: normalizedEmail,
    status: 'pending', // Strictly pending, no domain auto-approval
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('institutional_access_requests')
      .insert(record)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[authProfileService] submitInstitutionalRequest DB error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as InstitutionalRequestRecord };
  } catch (err: any) {
    console.error('[authProfileService] submitInstitutionalRequest error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error submitting request' };
  }
}

/**
 * Check if an authenticated user is an authorized approver.
 * Rules:
 * 1. Must be authenticated with an approved profile in profiles table.
 * 2. User's email must be listed in institutional_approval_configs.authorized_approver_emails
 *    OR user has an approved profile with role IN ('municipal', 'healthcare', 'disaster_management').
 */
export async function isAuthorizedApprover(userId: string, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  try {
    // 1. Check if user's email is explicitly listed in approval configs
    const { data: configs } = await supabase
      .from('institutional_approval_configs')
      .select('authorized_approver_emails');

    if (configs && configs.length > 0) {
      for (const cfg of configs) {
        const approvers: string[] = cfg.authorized_approver_emails || [];
        if (approvers.some((a) => a.trim().toLowerCase() === normalized)) {
          return true;
        }
      }
    }

    // 2. Check if user profile has an approved institutional role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', userId)
      .maybeSingle();

    if (profile && profile.approval_status === 'approved') {
      if (['municipal', 'healthcare', 'disaster_management'].includes(profile.role)) {
        return true;
      }
    }
  } catch (err: any) {
    console.error('[authProfileService] isAuthorizedApprover error:', err?.message || err);
  }

  return false;
}

/**
 * Get institutional requests.
 * ONLY callable by verified authorized approvers.
 */
export async function getInstitutionalRequests(options?: {
  role?: string;
  status?: string;
  email?: string;
}): Promise<InstitutionalRequestRecord[]> {
  try {
    let query = supabase.from('institutional_access_requests').select('*');

    if (options?.role) query = query.eq('requested_role', options.role);
    if (options?.status) query = query.eq('status', options.status);
    if (options?.email) query = query.eq('email', options.email.trim().toLowerCase());

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('[authProfileService] getInstitutionalRequests error:', error.message);
      return [];
    }

    return (data as InstitutionalRequestRecord[]) || [];
  } catch (err: any) {
    console.error('[authProfileService] getInstitutionalRequests error:', err?.message || err);
    return [];
  }
}

/**
 * Approve or reject an institutional access request.
 * - Approver cannot approve their own request (self-approval prohibited)
 * - If approved, updates any existing profile for that email
 */
export async function reviewInstitutionalRequest(
  requestId: string,
  decision: 'approved' | 'rejected' | 'disabled',
  approverEmail: string,
  notes?: string
): Promise<{ success: boolean; data?: InstitutionalRequestRecord; error?: string }> {
  const now = new Date().toISOString();

  // Fetch the target request
  const { data: targetReq, error: fetchErr } = await supabase
    .from('institutional_access_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (fetchErr || !targetReq) {
    return { success: false, error: 'Target request not found.' };
  }

  // SELF-APPROVAL PROHIBITION: Approver cannot approve their own request!
  if (targetReq.email.trim().toLowerCase() === approverEmail.trim().toLowerCase()) {
    return { success: false, error: 'Self-approval is forbidden: You cannot review or approve your own access request.' };
  }

  const updates = {
    status: decision,
    reviewed_by: approverEmail.trim().toLowerCase(),
    reviewed_at: now,
    review_notes: notes || `Request marked ${decision} by ${approverEmail}`,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('institutional_access_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[authProfileService] reviewInstitutionalRequest error:', error.message);
      return { success: false, error: error.message };
    }

    // If approved, update existing profile if the user has already registered
    if (decision === 'approved') {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetReq.email.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            role: targetReq.requested_role,
            approval_status: 'approved',
            updated_at: now,
          })
          .eq('id', existingProfile.id);
      }
    }

    return { success: true, data: data as InstitutionalRequestRecord };
  } catch (err: any) {
    console.error('[authProfileService] reviewInstitutionalRequest error:', err?.message || err);
    return { success: false, error: err?.message || 'Database error updating review' };
  }
}

/**
 * Fetch institutional approval configs (server-side only)
 */
export async function getApprovalConfigs(): Promise<ApprovalConfigRecord[]> {
  try {
    const { data, error } = await supabase
      .from('institutional_approval_configs')
      .select('*');

    if (!error && data) {
      return data as ApprovalConfigRecord[];
    }
  } catch (err: any) {
    console.error('[authProfileService] getApprovalConfigs error:', err?.message || err);
  }

  return [];
}
