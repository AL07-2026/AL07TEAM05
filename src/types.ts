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
