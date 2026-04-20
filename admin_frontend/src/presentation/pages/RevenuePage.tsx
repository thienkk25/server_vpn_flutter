import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../hooks/useAdminStore';
import { DollarSign, TrendingUp, ShoppingCart, Activity, ShieldCheck, Beaker, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export const RevenuePage: React.FC = () => {
    const { revenue, isLoadingRevenue, fetchRevenue } = useAdminStore();
    const { t } = useTranslation();
    const [environment, setEnvironment] = useState<'production' | 'sandbox'>('production');

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue]);

    if (isLoadingRevenue) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    if (!revenue) {
        return <div className="p-8 text-center text-gray-500">{t('revenue.noData')} (revenue is missing)</div>;
    }

    // Tương thích ngược: nếu Backend chưa được khởi động lại để trả về production/sandbox, thì dùng cục tổng ban đầu.
    const displayRevenue = revenue[environment] || revenue;

    if (!displayRevenue || displayRevenue.totalRevenue === undefined) {
        return (
            <div className="p-8 text-center text-red-500 font-mono">
                <p>{t('revenue.noData')}</p>
                <br />
                {/* DEBUG CỦA DEV: IN THẲNG DATA RA ĐỂ XEM BỊ LỖI GÌ */}
                DEBUG PAYLOAD: {JSON.stringify(revenue)}
            </div>
        );
    }

    const chartData = [
        ...displayRevenue.recentTransactions.reduce((acc: any, tx: any) => {
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
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <style>{`
                @keyframes spinRotation {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .revenue-spin {
                    animation: spinRotation 1s linear infinite;
                }
                @media (max-width: 900px) {
                    .middle-section { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Header Area */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', background: 'linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(67,56,202,0.05) 100%)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>{t('revenue.title')}</h1>
                    <p className="text-muted" style={{ margin: 0 }}>{t('revenue.subtitle')}</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '20px', padding: '4px' }}>
                        <button
                            onClick={() => setEnvironment('production')}
                            style={{
                                background: environment === 'production' ? 'var(--accent-color)' : 'transparent',
                                color: 'white', border: 'none', padding: '8px 16px', borderRadius: '16px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                fontWeight: environment === 'production' ? 'bold' : 'normal', transition: '0.3s'
                            }}
                        >
                            <ShieldCheck size={16} /> Production
                        </button>
                        <button
                            onClick={() => setEnvironment('sandbox')}
                            style={{
                                background: environment === 'sandbox' ? 'var(--accent-color)' : 'transparent',
                                color: 'white', border: 'none', padding: '8px 16px', borderRadius: '16px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                fontWeight: environment === 'sandbox' ? 'bold' : 'normal', transition: '0.3s'
                            }}
                        >
                            <Beaker size={16} /> Sandbox
                        </button>
                    </div>
                    <button
                        onClick={() => fetchRevenue()}
                        disabled={isLoadingRevenue}
                        className="action-btn"
                        style={{ padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isLoadingRevenue ? 0.5 : 1 }}
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw size={20} className={isLoadingRevenue ? "revenue-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <TrendingUp size={100} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: 'var(--success-color)' }} />
                    <div style={{ width: '48px', height: '48px', background: 'rgba(46,213,115,0.1)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={24} color="var(--success-color)" />
                    </div>
                    <h3 className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{t('revenue.totalRevenue')}</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>${displayRevenue.totalRevenue.toFixed(2)}</p>
                </div>

                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <Activity size={100} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: '#3498db' }} />
                    <div style={{ width: '48px', height: '48px', background: 'rgba(52,152,219,0.1)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={24} color="#3498db" />
                    </div>
                    <h3 className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{t('revenue.monthlyRevenue')}</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>${displayRevenue.monthlyRevenue.toFixed(2)}</p>
                </div>

                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <ShoppingCart size={100} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: 'var(--accent-color)' }} />
                    <div style={{ width: '48px', height: '48px', background: 'rgba(108,92,231,0.1)', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingCart size={24} color="var(--accent-color)" />
                    </div>
                    <h3 className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{t('revenue.totalTransactions')}</h3>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{t('revenue.salesCount', { count: displayRevenue.salesCount })}</p>
                </div>
            </div>

            {/* Middle Section (Chart & Top Products) */}
            <div className="middle-section" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <TrendingUp size={20} className="text-muted" /> {t('revenue.growthChart')}
                    </h3>
                    <div style={{ height: '300px' }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8b92a5', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b92a5', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--glass-border)', color: 'white', borderRadius: '8px' }}
                                        itemStyle={{ color: 'white' }}
                                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                                    />
                                    <Area type="monotone" dataKey="amount" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="text-muted">
                                {t('revenue.noChartData')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <ShoppingCart size={20} className="text-muted" /> {t('revenue.topProducts')}
                    </h3>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {displayRevenue.topProducts.map((p: any, index: number) => {
                                const rankColors = [
                                    { bg: 'rgba(255, 165, 2, 0.2)', text: '#ffa502' },
                                    { bg: 'rgba(255, 255, 255, 0.1)', text: 'white' },
                                    { bg: 'rgba(255, 127, 80, 0.2)', text: '#ff7f50' },
                                    { bg: 'rgba(108, 92, 231, 0.2)', text: 'var(--accent-color)' }
                                ];
                                const color = rankColors[index] || rankColors[3];
                                return (
                                    <div key={p.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: color.bg, color: color.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                                #{index + 1}
                                            </div>
                                            <span style={{ fontSize: '0.9rem' }}>{p.productId}</span>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>${p.revenue.toFixed(2)}</div>
                                    </div>
                                );
                            })}
                            {displayRevenue.topProducts.length === 0 && (
                                <div className="text-muted text-center" style={{ padding: '20px 0' }}>{t('revenue.noProducts')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <Activity size={20} className="text-muted" /> {t('revenue.recentTransactions')}
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('revenue.date')}</th>
                                <th>{t('revenue.transactionId')}</th>
                                <th>{t('revenue.product')}</th>
                                <th>{t('revenue.status')}</th>
                                <th style={{ textAlign: 'right' }}>{t('revenue.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayRevenue.recentTransactions.slice(0, 10).map((tx: any) => (
                                <tr key={tx.id || Math.random()}>
                                    <td className="text-muted">{new Date(tx.timestamp).toLocaleString()}</td>
                                    <td style={{ fontFamily: 'monospace' }} className="text-muted">{tx.transactionId || tx.originalTransactionId}</td>
                                    <td>
                                        <span className="status-badge" style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent-color)' }}>
                                            {tx.productId}
                                        </span>
                                    </td>
                                    <td>
                                        {tx.amount > 0 ? (
                                            <span className="status-badge active">{t('revenue.success', 'Success')}</span>
                                        ) : tx.amount === 0 ? (
                                            <span className="status-badge" style={{ background: 'rgba(255, 165, 2, 0.1)', color: 'var(--warning-color)', border: '1px solid rgba(255, 165, 2, 0.3)' }}>{t('revenue.trial', 'Trial/Promo')}</span>
                                        ) : (
                                            <span className="status-badge offline">{t('revenue.refund', 'Refunded')}</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: tx.amount > 0 ? 'var(--success-color)' : tx.amount === 0 ? 'var(--warning-color)' : 'var(--danger-color)' }}>
                                        {tx.amount > 0 ? '+' : tx.amount < 0 ? '-' : ''}${Math.abs(tx.amount).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            {displayRevenue.recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted" style={{ padding: '30px 0' }}>
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
}
