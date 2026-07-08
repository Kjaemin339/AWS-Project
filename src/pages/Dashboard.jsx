import { useEffect } from 'react';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { formatWon } from '../data/mockData';
import { spinnerStyle } from '../components/formStyles';

const BAR_COLORS = ['#171717', '#4B4B4B', '#8A8A8A', '#B7B7B7', '#DDDDDD', '#EFEFEF'];

export default function Dashboard() {
  const { dashboardStats, dashboardLoading, dashboardError, loadDashboardStats } = useApp();

  useEffect(() => {
    loadDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryDist = dashboardStats?.category_distribution || [];
  const monthlyTrend = dashboardStats?.monthly_trend || [];
  const maxMonthlyCount = Math.max(1, ...monthlyTrend.map((m) => m.count));

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar variant="full" />
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 28px' }}>대시보드</h2>

        {dashboardLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B6B6B', fontWeight: 500, marginBottom: '20px' }}>
            <span style={spinnerStyle('13px', '#ECECEC', '#171717')} />
            집계 데이터를 불러오는 중입니다...
          </div>
        )}

        {dashboardError && <p style={{ fontSize: '13px', color: '#C0392B', fontWeight: 500, marginBottom: '20px' }}>{dashboardError}</p>}

        {dashboardStats && dashboardStats.total_sessions === 0 && (
          <p style={{ fontSize: '14px', color: '#9A9A9A' }}>아직 누적된 매칭 이력이 없습니다.</p>
        )}

        {dashboardStats && dashboardStats.total_sessions > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800 }}>{dashboardStats.total_programs_matched}건</div>
                <div style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>누적 매칭 건수</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800 }}>{formatWon(dashboardStats.total_expected_revenue)}</div>
                <div style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>누적 예상 매출 영향</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800 }}>{dashboardStats.total_expected_jobs.toFixed(1)}명</div>
                <div style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>누적 예상 고용창출 합계</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>지원분야별 매칭 분포</div>
                {categoryDist.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9A9A9A' }}>데이터가 없습니다</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {categoryDist.map((c, i) => (
                      <div key={c.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#5A5A5A' }}>{c.label}</span>
                          <span style={{ fontWeight: 700, color: '#171717' }}>{c.pct}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '4px', width: c.pct + '%', background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>월별 매칭 추이</div>
                {monthlyTrend.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9A9A9A' }}>데이터가 없습니다</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', paddingTop: '10px' }}>
                    {monthlyTrend.map((m) => (
                      <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '36px',
                            background: '#171717',
                            borderRadius: '6px 6px 0 0',
                            height: Math.round((m.count / maxMonthlyCount) * 100) + '%',
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#9A9A9A', fontWeight: 600 }}>{m.month}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
