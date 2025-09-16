import { Bot, Brain, Sparkles, Route, Gift, LucideIcon } from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Bot: Bot,
  Brain: Brain,
  Sparkles: Sparkles,
  Route: Route,
  Gift: Gift,
};

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Bot; // Default to Bot icon if not found
}