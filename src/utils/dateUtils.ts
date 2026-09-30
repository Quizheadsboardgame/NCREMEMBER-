export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysAheadString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  return `${hours}:${minutes} ${ampm}`;
}

export function formatDateFriendly(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayString();
  const tomorrow = getTomorrowString();

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);

    const isCurrentYear = new Date().getFullYear() === year;
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...(isCurrentYear ? {} : { year: 'numeric' }),
    });
  }

  return dateStr;
}

export interface DueStatus {
  isOverdue: boolean;
  isToday: boolean;
  isDueSoon: boolean;
  text: string;
}

export function getDueStatus(dueDate: string, hasTime: boolean, dueTime?: string, completed?: boolean): DueStatus {
  if (completed) {
    return {
      isOverdue: false,
      isToday: false,
      isDueSoon: false,
      text: 'Completed',
    };
  }

  const today = getTodayString();
  const now = new Date();

  // If due date is before today
  if (dueDate < today) {
    const d1 = new Date(dueDate).getTime();
    const d2 = new Date(today).getTime();
    const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)));
    return {
      isOverdue: true,
      isToday: false,
      isDueSoon: false,
      text: diffDays === 1 ? 'Overdue by 1 day' : `Overdue by ${diffDays} days`,
    };
  }

  // If due date is today
  if (dueDate === today) {
    if (hasTime && dueTime) {
      const [dueHours, dueMinutes] = dueTime.split(':').map((v) => parseInt(v, 10));
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      const dueInMinutes = dueHours * 60 + dueMinutes;
      const currentInMinutes = currentHours * 60 + currentMinutes;
      const diffMinutes = dueInMinutes - currentInMinutes;

      if (diffMinutes < 0) {
        return {
          isOverdue: true,
          isToday: true,
          isDueSoon: false,
          text: 'Overdue today',
        };
      } else if (diffMinutes <= 60) {
        return {
          isOverdue: false,
          isToday: true,
          isDueSoon: true,
          text: `Due in ${diffMinutes}m`,
        };
      }
    }
    return {
      isOverdue: false,
      isToday: true,
      isDueSoon: false,
      text: 'Due Today',
    };
  }

  // Future date
  if (dueDate === getTomorrowString()) {
    return {
      isOverdue: false,
      isToday: false,
      isDueSoon: false,
      text: 'Tomorrow',
    };
  }

  return {
    isOverdue: false,
    isToday: false,
    isDueSoon: false,
    text: formatDateFriendly(dueDate),
  };
}
