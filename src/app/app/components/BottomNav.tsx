'use client';

// App-shell bottom navigation — vector icons (not emoji), glass backdrop, active
// scale + underline, light haptic. Same quality bar as tec-assets.
import { Icon, type EstIconName } from './Icon';
import { useTranslation } from '@/lib/i18n';

export type EstTab = 'home' | 'portfolio' | 'pro' | 'settings';

export function BottomNav({ active, onSelect }: { active: EstTab; onSelect: (t: EstTab) => void }) {
  const { t } = useTranslation();
  const ITEMS: { key: EstTab; icon: EstIconName; label: string }[] = [
    { key: 'home',      icon: 'home',     label: t.estate.nav.home      },
    { key: 'portfolio', icon: 'building', label: t.estate.nav.portfolio },
    { key: 'pro',       icon: 'star',     label: t.estate.nav.pro       },
    { key: 'settings',  icon: 'settings', label: t.estate.nav.settings  },
  ];
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(5,8,22,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { navigator.vibrate?.(8); onSelect(item.key); }}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            style={{
              position: 'relative', flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 5, padding: '10px 0 12px',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s' }}>
              <Icon name={item.icon} size={21} color={isActive ? '#FBBF24' : '#3a3a4a'} strokeWidth={isActive ? 2.2 : 1.9} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: isActive ? '#FBBF24' : '#3a3a4a', transition: 'color 0.2s' }}>
              {item.label}
            </div>
            {isActive && (
              <div style={{ position: 'absolute', bottom: 0, width: 20, height: 2, borderRadius: 1, background: '#FBBF24' }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
