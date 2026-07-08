import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { PROGRAMS, CATEGORY_DIST } from '../data/mockData';
import { announcementChipStyle } from '../components/formStyles';

const TREND_LABELS = ['1분기', '2분기', '3분기', '4분기'];
const MAX_TREND = 30;

export default function Dashboard() {
  const { dashboardSelectedId, dashboardHighlightId, selectDashboardAnnouncement } = useApp();

  const trendProgram = PROGRAMS.find((p) => p.id === dashboardSelectedId) || PROGRAMS[0];
  const trendBars = trendProgram.trend.map((v, i) => ({ label: TREND_LABELS[i], heightPct: Math.round((v / MAX_TREND) * 100) + '%' }));

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar variant="full" />
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 28px' }}>대시보드</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>128건</div>
            <div style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>누적 매칭 건수</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>+18.4%</div>
            <div style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>누적 예상 매출 영향</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>42명</div>
            <div style={{ fontSize: '13px', color: '#9A9A9A', fontWeight: 600, marginTop: '6px' }}>누적 예상 고용창출 합계</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px' }}>지원분야별 매칭 분포</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {CATEGORY_DIST.map((c) => (
                <div key={c.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: '#5A5A5A' }}>{c.label}</span>
                    <span style={{ fontWeight: 700, color: '#171717' }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '4px', width: c.pct + '%', background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: '16px', padding: '28px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>공고별 매출 성장 추이</div>
            {!!dashboardHighlightId && (
              <div
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#171717',
                  background: '#F2F2F2',
                  border: '1px solid #D8D8D8',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  marginBottom: '10px',
                }}
              >
                공고 상세에서 연결됨
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0 20px' }}>
              {PROGRAMS.map((p) => (
                <div key={p.id} onClick={() => selectDashboardAnnouncement(p.id)} style={announcementChipStyle(dashboardSelectedId === p.id)}>
                  {p.shortTitle}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '140px', paddingTop: '10px' }}>
              {trendBars.map((t) => (
                <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', maxWidth: '36px', background: '#171717', borderRadius: '6px 6px 0 0', height: t.heightPct }} />
                  <span style={{ fontSize: '11px', color: '#9A9A9A', fontWeight: 600 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
