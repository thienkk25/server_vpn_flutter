import React, { useEffect } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { DollarSign, TrendingUp, ShoppingCart, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export const RevenuePage: React.FC = () => {
    const { revenue, isLoadingRevenue, fetchRevenue } = useAdminStore();
    const { t } = useTranslation();

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    if (isLoadingRevenue) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (!revenue) {
        return <div className="p-8 text-center text-gray-500">{t('revenue.noData')}</div>;
    }

    // Biểu đồ tĩnh mô phỏng dữ liệu (thực tế backend có thể trả chart data)
    // Để tối giản, tôi giả lập data cho chart từ history
    const chartData = [
        ...revenue.recentTransactions.reduce((acc: any, tx: any) => {
            const date = new Date(tx.timestamp).toLocaleDateString();
            const existing = acc.find((item: any) => item.date === date);
            if (existing) {
                existing.amount += tx.amount;
            } else {
                acc.push({ date, amount: tx.amount });
            }
            return acc;
        }, []).reverse()
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">{t('revenue.title')}</h1>
                    <p className="text-blue-100 opacity-90 text-sm">{t('revenue.subtitle')}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-md">
                    <DollarSign className="w-8 h-8 text-white" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-green-500" />
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 z-10">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium z-10">{t('revenue.totalRevenue')}</h3>
                    <p className="text-4xl font-bold tracking-tight mt-2 text-gray-900 z-10">
                        ${revenue.totalRevenue.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 z-10">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium z-10">{t('revenue.monthlyRevenue')}</h3>
                    <p className="text-4xl font-bold tracking-tight mt-2 text-gray-900 z-10">
                        ${revenue.monthlyRevenue.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingCart className="w-24 h-24 text-indigo-500" />
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4 z-10">
                        <ShoppingCart className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium z-10">{t('revenue.totalTransactions')}</h3>
                    <p className="text-4xl font-bold tracking-tight mt-2 text-gray-900 z-10">
                        {t('revenue.salesCount', { count: revenue.salesCount })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 font-display flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        {t('revenue.growthChart')}
                    </h3>
                    <div className="h-72">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'USD']}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">{t('revenue.noChartData')}</div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 font-display flex items-center gap-2 mb-6">
                        <ShoppingCart className="w-5 h-5 text-gray-400" />
                        {t('revenue.topProducts')}
                    </h3>
                    <div className="flex-1 overflow-y-auto">
                        <div className="space-y-4 pr-2">
                            {revenue.topProducts.map((p: any, index: number) => (
                                <div key={p.productId} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{p.productId}</p>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-gray-900">${p.revenue.toFixed(2)}</div>
                                </div>
                            ))}
                            {revenue.topProducts.length === 0 && (
                                <p className="text-center text-sm text-gray-400 py-4">{t('revenue.noProducts')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 font-display flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-gray-400" />
                    {t('revenue.recentTransactions')}
                </h3>
                <div className="overflow-x-auto rounded-xl ring-1 ring-black/5">
                    <table className="min-w-full divide-y flex flex-col lg:table divide-gray-200">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('revenue.date')}</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('revenue.transactionId')}</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('revenue.product')}</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('revenue.status')}</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('revenue.amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100 relative">
                            {revenue.recentTransactions.slice(0, 10).map((tx: any) => (
                                <tr key={tx.id || Math.random()} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(tx.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                                        {tx.transactionId || tx.originalTransactionId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200/50">
                                            {tx.productId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {tx.amount > 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200/50">
                                                {t('revenue.success')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200/50">
                                                {t('revenue.refund')}
                                            </span>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold tracking-tight ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {revenue.recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400 bg-gray-50">
                                        {t('revenue.noTransactions')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
