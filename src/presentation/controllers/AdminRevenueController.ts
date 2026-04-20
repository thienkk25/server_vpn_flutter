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

      const transactions = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Ideally, over a huge dataset, you'd aggregate this on write rather than read.
      // But for a simple VPN app, fetching limited recent history and performing simple queries is adequate.
      
      const allTxSnapshot = await db.collection('revenue_transactions').get();
      const allTransactions = allTxSnapshot.docs.map(doc => doc.data());

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let salesCount = 0;
      const productStats: Record<string, number> = {};

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      for (const tx of allTransactions) {
        // Only count Production transactions for precise real revenue (But we'll include all for total visibility at first)
        // If you want strictly production: if (tx.environment !== 'Production') continue;

        if (tx.amount) {
          totalRevenue += tx.amount;
          salesCount++;

          if (tx.timestamp >= startOfMonth) {
            monthlyRevenue += tx.amount;
          }

          if (tx.amount > 0) {
            productStats[tx.productId] = (productStats[tx.productId] || 0) + tx.amount;
          }
        }
      }

      const topProducts = Object.entries(productStats)
        .map(([productId, revenue]) => ({ productId, revenue }))
        .sort((a, b) => b.revenue - a.revenue);

      res.status(200).json({
        totalRevenue,
        monthlyRevenue,
        salesCount,
        topProducts,
        recentTransactions: transactions,
      });

    } catch (error: any) {
      console.error('[AdminRevenueController] Failed to get revenue stats:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
