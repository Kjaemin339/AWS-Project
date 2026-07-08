import { useApp } from '../context/AppContext';
import { INDUSTRIES, REGIONS, WORKER_COUNTS, YEARS_OPTIONS, SUPPORT_FIELDS } from '../data/mockData';
import { chipStyle, radioStyle, dotOuterStyle, dotInnerStyle, preStartupBoxStyle } from './formStyles';

export default function ProfileForm({ idSuffix = '' }) {
  const { profile, updateProfile, toggleSupportField, togglePreStartup, setBizRegNumber } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>업종</label>
        <input
          list={'industryList' + idSuffix}
          value={profile.industry}
          onChange={(e) => updateProfile('industry', e.target.value)}
          placeholder="업종을 선택하거나 직접 입력하세요"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #DDDDDD',
            borderRadius: '10px',
            fontSize: '14px',
            background: '#fff',
            color: '#171717',
            fontFamily: 'inherit',
          }}
        />
        <datalist id={'industryList' + idSuffix}>
          {INDUSTRIES.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>근로자수</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {WORKER_COUNTS.map((label) => {
            const selected = profile.workerCount === label;
            return (
              <div key={label} onClick={() => updateProfile('workerCount', label)} style={radioStyle(selected)}>
                <div style={dotOuterStyle(selected)}>{selected && <div style={dotInnerStyle} />}</div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>소재지</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            style={{
              padding: '12px 16px',
              border: '1px solid #E5E5E5',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#F5F5F5',
              color: '#6B6B6B',
              flexShrink: 0,
            }}
          >
            경상북도
          </div>
          <input
            list={'regionList' + idSuffix}
            value={profile.locationDetail}
            onChange={(e) => updateProfile('locationDetail', e.target.value)}
            placeholder="예: 포항시"
            style={{
              flex: 1,
              minWidth: 0,
              padding: '12px 14px',
              border: '1px solid #DDDDDD',
              borderRadius: '10px',
              fontSize: '14px',
              background: '#fff',
              color: '#171717',
              fontFamily: 'inherit',
            }}
          />
          <datalist id={'regionList' + idSuffix}>
            {REGIONS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
          업력 {profile.preStartup && <span style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 500 }}>(예비창업자는 입력하지 않습니다)</span>}
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', opacity: profile.preStartup ? 0.4 : 1 }}>
          {YEARS_OPTIONS.map((label) => {
            const selected = profile.years === label;
            return (
              <div
                key={label}
                onClick={() => !profile.preStartup && updateProfile('years', label)}
                style={{ ...radioStyle(selected), cursor: profile.preStartup ? 'default' : 'pointer' }}
              >
                <div style={dotOuterStyle(selected)}>{selected && <div style={dotInnerStyle} />}</div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div onClick={togglePreStartup} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
        <div style={preStartupBoxStyle(profile.preStartup)}>
          {profile.preStartup && <div style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '2px' }} />}
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>예비창업자입니다</span>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
          희망 지원분야 <span style={{ fontSize: '12px', color: '#9A9A9A', fontWeight: 500 }}>(복수 선택 가능)</span>
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SUPPORT_FIELDS.map((label) => (
            <div key={label} onClick={() => toggleSupportField(label)} style={chipStyle(profile.supportFields.includes(label))}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
          사업자등록번호{' '}
          <span style={{ fontSize: '11px', color: '#9A9A9A', background: '#F2F2F2', padding: '2px 8px', borderRadius: '6px', fontWeight: 500 }}>
            선택
          </span>
        </label>
        <input
          value={profile.bizRegNumber}
          onChange={(e) => setBizRegNumber(e.target.value)}
          placeholder="000-00-00000"
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #DDDDDD',
            borderRadius: '10px',
            fontSize: '14px',
            background: '#fff',
            color: '#171717',
            fontFamily: 'inherit',
          }}
        />
        <p style={{ fontSize: '12px', color: '#9A9A9A', margin: '10px 0 0', lineHeight: 1.5 }}>
          입력하지 않아도 매칭 진행에는 지장이 없습니다. 인증서 보유 여부는 매칭 결과 화면에서 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
