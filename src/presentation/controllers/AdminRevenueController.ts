import { Request, Response } from 'express';
import { db } from '../../infrastructure/config/firebase';

export class AdminRevenueController {
  public getRevenueStats = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!db) {
        res.status(500).json({ error: 'DB not initialized' });
        return;
      }

      // 1. Fetch transactions (Filtering out Sandbox environment if needed in the future, currently counting all or you can filter by environment === 'Production')
      // Note: Typically you only count 'Production' revenue, but for ease of testing we're counting both or letting frontend decide.
      // We will summarize total revenue, monthly revenue, and return recent transactions.
      const txSnapshot = await db.collection('revenue_transactions')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      const transactions: any[] = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Ideally, over a huge dataset, you'd aggregate this on write rather than read.
      // But for a simple VPN app, fetching limited recent history and performing simple queries is adequate.
      
      const allTxSnapshot = await db.collection('revenue_transactions').get();
      const allTransactions: any[] = allTxSnapshot.docs.map(doc => doc.data());

      const createEnvStats = () => ({
        totalRevenue: 0,
        monthlyRevenue: 0,
        salesCount: 0,
        productStats: {} as Record<string, number>,
        recentTransactions: [] as any[],
        topProducts: [] as any[],
      });

      const stats = {
        Production: createEnvStats(),
        Sandbox: createEnvStats(),
      };

      for (const tx of transactions) {
        const env = tx.environment === 'Sandbox' ? 'Sandbox' : 'Production';
        stats[env].recentTransactions.push(tx);
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      for (const tx of allTransactions) {
        const env = tx.environment === 'Sandbox' ? 'Sandbox' : 'Production';
        const target = stats[env];

        if (tx.amount !== undefined) {
          target.totalRevenue += tx.amount;
          target.salesCount++;

          if (tx.timestamp >= startOfMonth) {
            target.monthlyRevenue += tx.amount;
          }

          if (tx.amount > 0) {
            target.productStats[tx.productId] = (target.productStats[tx.productId] || 0) + tx.amount;
          }
        }
      }

      stats.Production.topProducts = Object.entries(stats.Production.productStats)
        .map(([productId, revenue]) => ({ productId, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      stats.Sandbox.topProducts = Object.entries(stats.Sandbox.productStats)
        .map(([productId, revenue]) => ({ productId, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      res.status(200).json({
        production: stats.Production,
        sandbox: stats.Sandbox
      });

    } catch (error: any) {
      console.error('[AdminRevenueController] Failed to get revenue stats:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
