// Factory Pattern - Creates notification strategy instances
import type { NotificationStrategy } from "@/strategies/notification/notification.strategy";
import { EmailNotificationStrategy } from "@/strategies/notification/email.strategy";
import { InAppNotificationStrategy } from "@/strategies/notification/inapp.strategy";
import { LinePushNotificationStrategy } from "@/strategies/notification/line-push.strategy";

export type NotificationChannel = "email" | "inapp" | "line_push";

const strategyMap: Record<NotificationChannel, () => NotificationStrategy> = {
  line_push: () => new LinePushNotificationStrategy(),
  email: () => new EmailNotificationStrategy(),
  inapp: () => new InAppNotificationStrategy(),
};

export class NotificationFactory {
  static create(channel: NotificationChannel): NotificationStrategy {
    const creator = strategyMap[channel];
    if (!creator) {
      throw new Error(`Unknown notification channel: ${channel}`);
    }
    return creator();
  }

  static createAll(): NotificationStrategy[] {
    return Object.values(strategyMap).map((creator) => creator());
  }
}
