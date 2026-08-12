export type PublicGuideProfile = {
  id: string;
  ownerUid: string;
  name: string;
  languages: string[];
  regions: string[];
  experienceRange: string;
  introduction: string;
  profilePhotoUrl?: string;
  verified: boolean;
  featured: boolean;
  displayOrder: number | null;
  publishedAt?: string;
  updatedAt: string;
};

export type GuideVerificationReview = {
  guideUid: string;
  reviewStatus: 'pending' | 'reviewing' | 'needs_info' | 'approved' | 'rejected';
  autoCheckStatus: 'ready' | 'blocked';
  flags: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  updatedAt: string;
  adminNote?: string;
};

export type GuideVerificationLog = {
  guideUid: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  adminUid: string;
  createdAt: string;
};

export type AdminRole = 'admin' | 'superadmin';

export type TravelerProfile = {
  ownerUid: string;
  displayName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export type TravelerRequest = {
  id?: string;
  ownerUid: string;
  travelerName: string;
  contactPhone: string;
  selectedGuideId?: string;
  selectedGuideName?: string;
  region: string;
  startDate: string;
  endDate: string;
  partySize: string;
  language: string;
  requestDetails: string;
  status: string;
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformAuditLog = {
  actorUid: string;
  actorRole: AdminRole;
  action: string;
  targetType: string;
  targetId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
};

export type AdminUser = {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
};
