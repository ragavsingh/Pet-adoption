import { ReportItem } from '../types/report';
import { INITIAL_REPORTS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { isRealMode } from '../utils/authMode';

const STORAGE_KEY = 'pet_adoption_reports_v1';

function loadReports(): ReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load reports', e);
  }
  saveReports(INITIAL_REPORTS);
  return INITIAL_REPORTS;
}

function saveReports(items: ReportItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save reports', e);
  }
}

export const reportService = {
  getReports(): ReportItem[] {
    return loadReports();
  },

  async submitReport(data: Omit<ReportItem, 'id' | 'status' | 'createdAt'>): Promise<ReportItem> {
    if (isRealMode()) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: inserted, error } = await (supabase as any)
            .from('reports')
            .insert({
              reporter_id: userData.user.id,
              target_type: data.targetType,
              target_id: data.targetId,
              target_name: data.targetName,
              reason: data.reason,
              description: data.description,
              status: 'open',
            })
            .select()
            .single();

          if (!error && inserted) {
            return {
              id: inserted.id,
              reporterName: data.reporterName,
              targetType: data.targetType,
              targetId: data.targetId,
              targetName: data.targetName,
              reason: data.reason,
              description: data.description,
              status: 'Pending',
              createdAt: inserted.created_at ? inserted.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            };
          }
        }
      } catch (err) {
        console.warn('[reportService] Error submitting report to Supabase, falling back to local simulation:', err);
      }
    }

    const all = loadReports();
    const newReport: ReportItem = {
      ...data,
      id: `rep_${Date.now()}`,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    all.unshift(newReport);
    saveReports(all);
    return newReport;
  },

  updateStatus(id: string, status: 'Resolved' | 'Dismissed'): void {
    const all = loadReports();
    const rep = all.find((r) => r.id === id);
    if (rep) {
      rep.status = status;
      saveReports(all);
    }
  },
};
