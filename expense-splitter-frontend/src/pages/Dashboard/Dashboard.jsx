import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getDashboardSummary } from "../../features/dashboard/dashboardSlice";
import styles from "./Dashboard.module.css";

function truncateLabel(text, max = 22) {
  const s = String(text || "");
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

function monthKeysLast(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
  }
  return out;
}

function formatMonthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1).toLocaleString("default", {
    month: "short",
    year: "2-digit",
  });
}

function Dashboard() {
  const dispatch = useDispatch();
  const { summary, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(getDashboardSummary());
  }, [dispatch]);

  const totals = summary?.totals || {};
  const analytics = summary?.analytics || {};
  const totalToReceive = totals.totalToReceive || 0;
  const totalToPay = totals.totalToPay || 0;
  const netBalance = totals.netBalance ?? 0;
  const pendingSettlementsCount = totals.pendingSettlementsCount || 0;
  const spentThisMonth = analytics.spentThisMonth || 0;

  const monthlyTrendData = useMemo(() => {
    const keys = monthKeysLast(12);
    const byMonth = new Map(
      (analytics.monthlySpending || []).map((r) => [r.month, r.spent]),
    );
    return keys.map((key) => ({
      monthKey: key,
      label: formatMonthLabel(key),
      spent: Math.round((byMonth.get(key) || 0) * 100) / 100,
    }));
  }, [analytics.monthlySpending]);

  const groupBarData = useMemo(() => {
    const rows = analytics.spendingByGroup || [];
    return rows
      .filter((r) => r.spent > 0)
      .map((r) => ({
        groupId: r.groupId,
        label: truncateLabel(r.name || r.groupId || "Group"),
        fullName: r.name || r.groupId || "Group",
        spent: Math.round(r.spent * 100) / 100,
      }));
  }, [analytics.spendingByGroup]);

  const groupChartHeight = useMemo(() => {
    const n = groupBarData.length;
    if (n === 0) return 320;
    return Math.min(580, Math.max(260, 24 + n * 44));
  }, [groupBarData]);

  const totalExpenseAmount = totals.totalExpenseAmount || 0;
  const yourShareAllTime = analytics.totalYourShareAllTime ?? 0;

  const chartTooltipStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    color: "var(--text-primary)",
    fontSize: "13px",
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <div className={styles.heroInner}>
          <div>
            <p className={styles.heroKicker}>Overview</p>
            <h1 className={styles.heroTitle}>Dashboard</h1>
            <p className={styles.heroSubtitle}>
              Balances, your spending share, and group pulse — all in one place.
            </p>
          </div>
          <div className={styles.heroNet}>
            <span className={styles.heroNetLabel}>Net position</span>
            <span
              className={`${styles.heroNetValue} ${
                netBalance > 0
                  ? styles.netPos
                  : netBalance < 0
                    ? styles.netNeg
                    : styles.netZero
              }`}
            >
              {netBalance > 0 ? "+" : ""}₹{Math.abs(netBalance).toFixed(2)}
            </span>
            <span className={styles.heroNetHint}>
              Receive ₹{totalToReceive.toFixed(2)} · Owe ₹
              {totalToPay.toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      <section className={styles.bento}>
        <div className={`${styles.tile} ${styles.tileReceive}`}>
          <span className={styles.tileLabel}>You&apos;ll receive</span>
          <span className={styles.tileAmount}>₹{totalToReceive.toFixed(2)}</span>
          <span className={styles.tileHint}>From simplified group debts</span>
        </div>
        <div className={`${styles.tile} ${styles.tilePay}`}>
          <span className={styles.tileLabel}>You owe</span>
          <span className={styles.tileAmount}>₹{totalToPay.toFixed(2)}</span>
          <span className={styles.tileHint}>Outgoing in settlements</span>
        </div>
        <div className={`${styles.tile} ${styles.tileSpend}`}>
          <span className={styles.tileLabel}>Your share this month</span>
          <span className={styles.tileAmount}>₹{spentThisMonth.toFixed(2)}</span>
          <span className={styles.tileHint}>Sum of your splits per expense</span>
        </div>
        <div className={`${styles.tile} ${styles.tileStat}`}>
          <span className={styles.tileLabel}>Pending settlement edges</span>
          <span className={styles.tileAmount}>{pendingSettlementsCount}</span>
          <span className={styles.tileHint}>
            {pendingSettlementsCount ? "Optimize debts in groups" : "All clear"}
          </span>
        </div>
      </section>

      <section className={styles.quickRow}>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>👥</span>
          <div>
            <div className={styles.quickNum}>{totals.totalGroups || 0}</div>
            <div className={styles.quickLabel}>Groups</div>
          </div>
        </div>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>🧾</span>
          <div>
            <div className={styles.quickNum}>{totals.totalExpenses || 0}</div>
            <div className={styles.quickLabel}>Expense records</div>
          </div>
        </div>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>💳</span>
          <div>
            <div className={styles.quickNum}>
              ₹{totalExpenseAmount.toFixed(2)}
            </div>
            <div className={styles.quickLabel}>Total billed (all groups)</div>
          </div>
        </div>
        <div className={styles.quickCard}>
          <span className={styles.quickIcon}>📊</span>
          <div>
            <div className={styles.quickNum}>
              ₹{yourShareAllTime.toFixed(2)}
            </div>
            <div className={styles.quickLabel}>Your share (all time)</div>
          </div>
        </div>
      </section>

      <section className={styles.chartsSection}>
        <h2 className={styles.sectionHeading}>Analytics</h2>
        <p className={styles.sectionLead}>
          Area chart: how your share moves month to month. Bar chart: your total
          share in each group — easy to scan with many groups.
        </p>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Your spending share by month</h3>
            {loading && !summary ? (
              <div className={styles.chartSkeleton} />
            ) : (
              <div className={styles.chartPlot}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={monthlyTrendData}
                    margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="monthShareAreaGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.65} />
                        <stop offset="55%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={{ stroke: "var(--border-color)" }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={{ stroke: "var(--border-color)" }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toFixed(2)}`,
                        "Your share",
                      ]}
                      labelFormatter={(label) => label}
                      contentStyle={chartTooltipStyle}
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#monthShareAreaGrad)"
                      dot={{
                        r: 3,
                        fill: "var(--bg-secondary)",
                        stroke: "#6366f1",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Your share by group</h3>
            {loading && !summary ? (
              <div className={styles.chartSkeleton} />
            ) : groupBarData.length === 0 ? (
              <p className={styles.chartEmpty}>
                No split expenses yet — once you share costs in a group, totals
                appear here per group.
              </p>
            ) : (
              <div className={styles.chartPlot}>
                <ResponsiveContainer width="100%" height={groupChartHeight}>
                  <BarChart
                    layout="vertical"
                    data={groupBarData}
                    margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="groupShareGrad"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="var(--border-color)"
                      opacity={0.6}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={{ stroke: "var(--border-color)" }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={112}
                      reversed
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      axisLine={{ stroke: "var(--border-color)" }}
                      interval={0}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `₹${Number(value).toFixed(2)}`,
                        "Your share",
                      ]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullName ?? ""
                      }
                      contentStyle={chartTooltipStyle}
                    />
                    <Bar
                      dataKey="spent"
                      fill="url(#groupShareGrad)"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionHeading}>People</h2>
          <Link to="/friends" className={styles.sectionLink}>
            Manage →
          </Link>
        </div>
        <div className={styles.listCard}>
          {loading && !summary ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : (summary?.friends || []).length ? (
            <div className={styles.list}>
              {summary.friends.slice(0, 5).map((friend) => (
                <div
                  key={friend.username || friend.userId}
                  className={styles.listRow}
                >
                  <div className={styles.listMain}>
                    <div className={styles.listTitle}>
                      {friend.displayName || friend.name || "Member"}
                    </div>
                    {friend.username ? (
                      <div className={styles.listMeta}>@{friend.username}</div>
                    ) : null}
                  </div>
                  <div className={styles.listRight}>
                    <div
                      className={`${styles.badge} ${
                        friend.netBalance > 0
                          ? styles.badgePositive
                          : friend.netBalance < 0
                            ? styles.badgeNegative
                            : styles.badgeNeutral
                      }`}
                    >
                      {friend.balanceText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No co-members in other groups yet. Join a group to connect.
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Recent activity</h2>
        <div className={styles.listCard}>
          {loading && !summary ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : (summary?.recentActivities || []).length ? (
            <div className={styles.list}>
              {summary.recentActivities.slice(0, 10).map((activity) => (
                <div key={activity.expenseId} className={styles.listRow}>
                  <div className={styles.listMain}>
                    <div className={styles.listTitle}>
                      {activity.title} · ₹{activity.amount}
                    </div>
                    <div className={styles.listMeta}>
                      Paid by{" "}
                      {activity.paidBy?.name
                        ? `${activity.paidBy.name}${
                            activity.paidBy?.username
                              ? ` (@${activity.paidBy.username})`
                              : ""
                          }`
                        : activity.paidBy?.username
                          ? `@${activity.paidBy.username}`
                          : "Someone"}{" "}
                      · {activity.group?.name || "Group"}
                    </div>
                  </div>
                  <div className={styles.listRight}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No expenses yet. Create a group and add one!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
