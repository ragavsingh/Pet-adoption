export type ReportTargetType = 'Pet Listing' | 'Provider' | 'Adopter' | 'Suspicious Activity' | 'Inappropriate Content';

export interface ReportItem {
  id: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  createdAt: string;
}
