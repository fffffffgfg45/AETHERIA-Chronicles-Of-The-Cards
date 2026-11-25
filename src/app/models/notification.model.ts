import { NavView } from '../app';

export type NotificationType = 'reward' | 'guild' | 'market' | 'battle' | 'system';
export type NotificationRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ToastAction {
  label: string;
  view?: NavView;
  style?: 'primary' | 'secondary' | 'gold' | 'danger';
  callback?: () => void;
}

export interface ToastNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  rarity?: NotificationRarity;
  duration: number; // in milliseconds
  remainingTime: number; // for progress bar
  timestamp: Date;
  read: boolean;
  paused: boolean;
  action?: ToastAction;
  secondaryAction?: ToastAction;
}
