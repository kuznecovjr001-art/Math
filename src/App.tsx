import { useEffect, useState } from 'react';
import { setVoiceEnabled, speak } from './audio/voice';
import { getMission } from './content/missions';
import { loadData, newId, saveData } from './engine/storage';
import type { AppData, Attempt } from './engine/types';
import { Album } from './screens/Album';
import { Credits } from './screens/Credits';
import { MapScreen } from './screens/MapScreen';
import { MissionPlayer, type PlayMode } from './screens/MissionPlayer';
import { ParentGate } from './screens/ParentGate';
import { ParentScreen } from './screens/ParentScreen';
import { Profiles } from './screens/Profiles';

type Screen =
  | { name: 'profiles' }
  | { name: 'map' }
  | { name: 'mission'; missionId: string; mode: PlayMode }
  | { name: 'album' }
  | { name: 'gate'; back: 'profiles' | 'map' }
  | { name: 'parent' }
  | { name: 'credits' };

export function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [screen, setScreen] = useState<Screen>({ name: 'profiles' });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    setSaveFailed(!saveData(data));
  }, [data]);

  useEffect(() => {
    setVoiceEnabled(data.settings.voice);
  }, [data.settings.voice]);

  const go = (s: Screen) => {
    setNow(Date.now());
    setScreen(s);
  };

  const profile = data.profiles.find((p) => p.id === profileId) ?? null;
  const stickers = profile ? data.stickers[profile.id] ?? [] : [];

  const addAttempt = (a: Omit<Attempt, 'id' | 'profileId' | 'at'>) => {
    if (!profile) return;
    const full: Attempt = { ...a, id: newId(), profileId: profile.id, at: Date.now() };
    setData((d) => ({ ...d, attempts: [...d.attempts, full] }));
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
          speak('Привет! Поиграем?');
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
              stickers: stickersLeft,
            };
          });
          if (profileId === id) setProfileId(null);
        }}
        onStartIsland={(id, startIsland) => setData((d) => ({
          ...d,
          profiles: d.profiles.map((p) => (p.id === id ? { ...p, startIsland } : p)),
        }))}
        onCredits={() => go({ name: 'credits' })}
      />
    );
  } else if (screen.name === 'credits') {
    body = <Credits onBack={() => go({ name: 'parent' })} />;
  }

  return (
    <div className="app">
      {saveFailed && (
        <div className="save-warning" role="alert">
          Браузер не даёт сохранить прогресс (возможно, включён приватный режим). Игра работает, но история не сохранится.
        </div>
      )}
      {body}
    </div>
  );
}
