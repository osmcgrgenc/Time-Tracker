'use client';

import { useAuth } from '@/contexts/AuthContext';
import Timesheet from '@/components/timesheet/Timesheet';

export default function TimesheetPage() {
  const { user } = useAuth();

  if (!user) {
    return null; // Will be handled by the main page
  }

  return <Timesheet />;
}