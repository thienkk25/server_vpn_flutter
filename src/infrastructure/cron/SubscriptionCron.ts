import cron from 'node-cron';
import { SubscriptionFirebaseRepository } from '../repositories/SubscriptionFirebaseRepository';

export const startSubscriptionCronJob = () => {
  // Run every hour to check subscriptions
  cron.schedule('0 * * * *', async () => {
    console.log('Running Subscription Cron Job...');
    try {
      const subscriptionRepository = new SubscriptionFirebaseRepository();
      const currentTimestamp = Date.now();
      
      await subscriptionRepository.revokeSubscriptionsOlderThan(currentTimestamp);
      console.log('Successfully revoked expired subscriptions.');
    } catch (error) {
      console.error('Error running Subscription Cron Job:', error);
    }
  });
  
  console.log('Subscription Cron Job scheduled.');
};
