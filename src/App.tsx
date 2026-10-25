import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { PHRASE } from './audio/phrases';
import { setVoiceEnabled, speak, stopSpeaking } from './audio/voice';
import { getMission } from './content/missions';
import { importMerge, loadData, newId, saveData } from './engine/storage';
import type { AppData, Attempt, MissionSession } from './engine/types';
import { MapScreen } from './screens/MapScreen';
import type { PlayMode } from './screens/MissionPlayer';
import { Profiles } from './screens/Profiles';
import { onNativeLifecycle } from './platform/native';
import { artVars } from './ui/art';

// Первый экран — профили и карта; миссия с играми и разделы для взрослых грузятся отдельно.
const load = {
  mission: () => import('./screens/MissionPlayer'),
  album: () => import('./screens/Album'),
  credits: () => import('./screens/Credits'),
  gate: () => import('./screens/ParentGate'),
  parent: () => import('./screens/ParentScreen'),
};
const MissionPlayer = lazy(() => load.mission().then((m) => ({ default: m.MissionPlayer })));
const Album = lazy(() => load.album().then((m) => ({ default: m.Album })));
const Credits = lazy(() => load.credits().then((m) => ({ default: m.Credits })));
const ParentGate = lazy(() => load.gate().then((m) => ({ default: m.ParentGate })));
const ParentScreen = lazy(() => load.parent().then((m) => ({ default: m.ParentScreen })));

/** Догружает остальные экраны после первого, чтобы они открывались сразу и работали без сети. */
export function preloadScreens(): Promise<unknown> {
  return Promise.all(Object.values(load).map((f) => f().catch(() => undefined)));
}

type Screen =
  | { name: 'profiles' }
  | { name: 'map' }
  | { name: 'mission'; missionId: string; mode: PlayMode }
  | { name: 'album' }
  | { name: 'gate'; back: 'profiles' | 'map' }
  | { name: 'parent' }
  | { name: 'credits' };

export function App() {
  const [loaded] = useState(() => loadData());
  const [data, setData] = useState<AppData>(loaded.data);
  const [screen, setScreen] = useState<Screen>({ name: 'profiles' });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    // Нечитаемую запись не удалось отложить: не трогаем её, пока взрослый не сохранит её в файл.
    setSaveFailed(loaded.issue === 'locked' || !saveData(data));
  }, [data, loaded.issue]);

  useEffect(() => {
    setVoiceEnabled(data.settings.voice);
  }, [data.settings.voice]);

  const go = (s: Screen) => {
    setNow(Date.now());
    setScreen(s);
  };

  // «Назад» на Android ведёт туда же, куда кнопки на экране; на первом экране приложение сворачивается.
  const backRef = useRef<() => boolean>(() => false);
  backRef.current = () => {
    const to: Record<Screen['name'], Screen | null> = {
      profiles: null,
      map: { name: 'profiles' },
      mission: { name: 'map' },
      album: { name: 'map' },
      gate: screen.name === 'gate' ? { name: screen.back } : null,
      parent: { name: 'profiles' },
      credits: { name: 'parent' },
    };
    const next = to[screen.name];
    if (next) go(next);
    return next !== null;
  };
  useEffect(() => {
    const off = onNativeLifecycle(() => backRef.current(), stopSpeaking, () => setNow(Date.now()));
    return () => { void off.then((f) => f()); };
  }, []);

  const profile = data.profiles.find((p) => p.id === profileId) ?? null;
  const stickers = profile ? data.stickers[profile.id] ?? [] : [];

  const addAttempt = (a: Omit<Attempt, 'id' | 'profileId' | 'at'>) => {
    if (!profile) return;
    const full: Attempt = { ...a, id: newId(), profileId: profile.id, at: Date.now() };
    setData((d) => ({ ...d, attempts: [...d.attempts, full] }));
  };

  const trackSession = (sn: Omit<MissionSession, 'profileId'>) => {
    if (!profile) return;
    const assigned = profile.mode === 'assigned' && (profile.plan ?? []).includes(sn.missionId);
    const full: MissionSession = { ...sn, profileId: profile.id, ...(assigned ? { assigned: true as const } : {}) };
    setData((d) => {
      const list = d.sessions ?? [];
      const i = list.findIndex((x) => x.id === sn.id);
      return { ...d, sessions: i < 0 ? [...list, full] : list.map((x, j) => (j === i ? { ...x, ...full } : x)) };
    });
  };

  const giveSticker = (missionId: string) => {
    if (!profile) return;
    setData((d) => {
      const list = d.stickers[profile.id] ?? [];
      if (list.includes(missionId)) return d;
      return { ...d, stickers: { ...d.stickers, [profile.id]: [...list, missionId] } };
    });
  };

  let body: React.ReactNode = null;
  if (screen.name === 'profiles' || (!profile && ['map', 'mission', 'album'].includes(screen.name))) {
    body = (
      <Profiles
        profiles={data.profiles}
        onPick={(id) => {
          setProfileId(id);
          speak(PHRASE.hello);
          go({ name: 'map' });
        }}
        onCreate={(name, avatar) => {
          const p = { id: newId(), name, avatar, createdAt: Date.now() };
          setData((d) => ({ ...d, profiles: [...d.profiles, p] }));
        }}
        onParent={() => go({ name: 'gate', back: 'profiles' })}
      />
    );
  } else if (screen.name === 'map' && profile) {
    body = (
      <MapScreen
        profile={profile}
        attempts={data.attempts}
        sessions={data.sessions ?? []}
        stickers={stickers}
        now={now}
        onStart={(missionId, mode) => go({ name: 'mission', missionId, mode })}
        onAlbum={() => go({ name: 'album' })}
        onSwitch={() => go({ name: 'profiles' })}
      />
    );
  } else if (screen.name === 'mission' && profile) {
    const mission = getMission(screen.missionId);
    if (mission) {
      body = (
        <MissionPlayer
          key={`${screen.missionId}-${screen.mode}`}
          mission={mission}
          mode={screen.mode}
          onAttempt={addAttempt}
          onSession={trackSession}
          onFinish={() => giveSticker(mission.id)}
          onExit={() => go({ name: 'map' })}
        />
      );
    }
  } else if (screen.name === 'album') {
    body = <Album stickers={stickers} onBack={() => go({ name: 'map' })} />;
  } else if (screen.name === 'gate') {
    const back = screen.back;
    body = <ParentGate onPass={() => go({ name: 'parent' })} onBack={() => go({ name: back })} />;
  } else if (screen.name === 'parent') {
    body = (
      <ParentScreen
        data={data}
        onBack={() => go({ name: 'profiles' })}
        onVoice={(voice) => setData((d) => ({ ...d, settings: { ...d.settings, voice } }))}
        onDeleteProfile={(id) => {
          setData((d) => {
            const { [id]: _removed, ...stickersLeft } = d.stickers;
            return {
              ...d,
              profiles: d.profiles.filter((p) => p.id !== id),
              attempts: d.attempts.filter((a) => a.profileId !== id),
              sessions: d.sessions?.filter((x) => x.profileId !== id),
              stickers: stickersLeft,
            };
          });
          if (profileId === id) setProfileId(null);
        }}
        onPlan={(id, mode, plan) => setData((d) => ({
          ...d,
          // Срок «сделано после назначения» сдвигается, только когда задание назначается заново.
          profiles: d.profiles.map((p) => (p.id !== id ? p : {
            ...p, mode, plan,
            planSince: p.mode === 'assigned' && (p.plan ?? []).length > 0 && p.planSince ? p.planSince : Date.now(),
          })),
        }))}
        onStartIsland={(id, startIsland) => setData((d) => ({
          ...d,
          profiles: d.profiles.map((p) => (p.id === id ? { ...p, startIsland } : p)),
        }))}
        onCredits={() => go({ name: 'credits' })}
        onImport={(text) => {
          if (!importMerge(data, text)) return false;
          setData((d) => importMerge(d, text) ?? d);
          return true;
        }}
      />
    );
  } else if (screen.name === 'credits') {
    body = <Credits onBack={() => go({ name: 'parent' })} />;
  }

  return (
    <div className="app" style={artVars()}>
      {loaded.issue && (
        <div className="save-warning" role="alert">
          {loaded.issue === 'restored'
            ? 'Сохранение было повреждено: восстановлена резервная копия. Повреждённая запись сохранена отдельно.'
            : loaded.issue === 'unreadable'
              ? 'Сохранение не удалось прочитать. Оно отложено и не удалено: в разделе для взрослых его можно сохранить в файл.'
              : 'Сохранение не удалось прочитать, а места, чтобы отложить его, нет. Новый прогресс не сохраняется, старая запись не тронута.'}
        </div>
      )}
      {saveFailed && (
        <div className="save-warning" role="alert">
          Браузер не даёт сохранить прогресс (возможно, включён приватный режим). Игра работает, но история не сохранится.
        </div>
      )}
      <main><Suspense fallback={<div className="screen loading" aria-busy="true" />}>{body}</Suspense></main>
    </div>
  );
}
