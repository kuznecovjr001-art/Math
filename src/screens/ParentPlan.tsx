import { useState } from 'react';
import { ISLANDS } from '../content/levels';
import { getMission } from '../content/missions';
import { planStatus } from '../content/plan';
import type { Attempt, MissionSession, Profile } from '../engine/types';

type Mode = NonNullable<Profile['mode']>;

interface Props {
  profile: Profile;
  attempts: Attempt[];
  sessions: MissionSession[];
  onPlan: (id: string, mode: Mode, plan: string[]) => void;
}

const MODES: [Mode, string, string][] = [
  ['free', 'Свободно', 'ребёнок выбирает сам, «Сегодня» предлагает повтор и новые миссии'],
  ['assigned', 'По заданию', '«Сегодня» ведёт к выбранным миссиям по учебному пути'],
  ['review', 'Повторение', '«Сегодня» предлагает только пройденные миссии, сначала те, что пора повторить'],
];

/** Задание взрослого: режим «Сегодня» и миссии по порядку. Закрытые миссии открываются по пути, а не перепрыгиваются. */
export function ParentPlan({ profile, attempts, sessions, onPlan }: Props) {
  const [mode, setMode] = useState<Mode>(profile.mode ?? 'free');
  const [plan, setPlan] = useState<string[]>(profile.plan ?? []);
  const [saved, setSaved] = useState(false);
  // В черновике только что отмеченные миссии ещё не сделаны.
  const status = planStatus({ ...profile, plan, planAt: profile.mode === 'assigned' ? profile.planAt : {} }, attempts, sessions);
  const toggle = (id: string) => {
    setSaved(false);
    setPlan((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  return (
    <section className="card" aria-labelledby="plan-h">
      <h2 id="plan-h">Задание</h2>
      <fieldset className="plain">
        <legend className="note">Что предлагать ребёнку на карте в «Сегодня»</legend>
        {MODES.map(([m, title, hint]) => (
          <label key={m} className="toggle">
            <input type="radio" name="plan-mode" checked={mode === m} onChange={() => { setMode(m); setSaved(false); }} />
            <span><b>{title}</b> — {hint}.</span>
          </label>
        ))}
      </fieldset>

      {mode === 'assigned' && (
        <>
          {status.length > 0 && (
            <ol className="plan-list">
              {status.map((s) => (
                <li key={s.id}>
                  <b>{getMission(s.id)!.title}</b>{' — '}
                  {s.done ? 'сделано' : s.next === s.id ? 'ждёт' : `сначала «${getMission(s.next)!.title}»`}
                  {' '}<button className="btn ghost small" onClick={() => toggle(s.id)} aria-label={`Убрать «${getMission(s.id)!.title}»`}>Убрать</button>
                </li>
              ))}
            </ol>
          )}
          <p className="note">Отметьте миссии по порядку. Миссия, до которой ребёнок ещё не дошёл, откроется через предыдущие шаги.</p>
          {ISLANDS.map((isl) => (
            <details key={isl.id}>
              <summary>{isl.title}</summary>
              {isl.missions.map((id) => (
                <label key={id} className="toggle">
                  <input type="checkbox" checked={plan.includes(id)} onChange={() => toggle(id)} />
                  <span>{getMission(id)!.title}</span>
                </label>
              ))}
            </details>
          ))}
        </>
      )}

      <div className="row wrap">
        <button
          className="btn primary"
          disabled={mode === 'assigned' && plan.length === 0}
          aria-describedby="plan-save-note"
          onClick={() => { onPlan(profile.id, mode, mode === 'assigned' ? plan : []); setSaved(true); }}
        >
          Сохранить
        </button>
        <span id="plan-save-note" role="status">
          {saved ? 'Сохранено.' : mode === 'assigned' && plan.length === 0 ? 'Отметьте хотя бы одну миссию.' : ''}
        </span>
      </div>
    </section>
  );
}
