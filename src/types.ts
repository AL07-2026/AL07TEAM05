export type PublicGuideProfile = {
  id: string;
  name: string;
  languages: string[];
  regions: string[];
  experienceRange: string;
  introduction: string;
  profilePhotoUrl?: string;
  verified: boolean;
  featured: boolean;
  displayOrder: number;
};
