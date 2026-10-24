import { useState } from 'react';
import { ISLANDS } from '../content/levels';
import { getMission, MISSIONS } from '../content/missions';
import { SKILLS, STATUS_TEXT } from '../content/skills';
import { missionCompleted, skillStatus } from '../engine/progress';
import type { AppData } from '../engine/types';
import { Emoji } from '../ui/art';

interface Props {
  data: AppData;
  onBack: () => void;
  onVoice: (on: boolean) => void;
  onDeleteProfile: (id: string) => void;
  onStartIsland: (id: string, island: number) => void;
  onCredits: () => void;
}

const VARIANT_TEXT = { A: 'обучение', B: 'самостоятельная проба', C: 'повтор после паузы' };
const HELP_TEXT = ['без помощи', 'после вопроса-подсказки', 'с моделью', 'после разобранного примера'];

function fmt(ts: number) {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ParentScreen({ data, onBack, onVoice, onDeleteProfile, onStartIsland, onCredits }: Props) {
  const [pid, setPid] = useState(data.profiles[0]?.id ?? '');
  const profile = data.profiles.find((p) => p.id === pid);
  const own = data.attempts.filter((a) => a.profileId === pid);
  const recent = [...own].sort((a, b) => b.at - a.at).slice(0, 15);
  // Навыки по островам: каждый навык показываем там, где он встречается впервые.
  const seen = new Set<string>();
  const skillsByIsland = ISLANDS.map((isl) => {
    const list = isl.missions.map((id) => getMission(id)!.skill).filter((s) => !seen.has(s) && seen.add(s));
    return { isl, skills: [...new Set(list)] };
  });
  const homeIdeas = MISSIONS.filter((m) => missionCompleted(own, m.id));

  return (
    <div className="screen parent">
      <header className="parent-bar">
        <button className="btn" onClick={onBack}>← К игре</button>
        <h1>Для взрослых</h1>
      </header>

      {data.profiles.length === 0 && <p>Профилей пока нет.</p>}

      {data.profiles.length > 1 && (
        <div className="row wrap">
          {data.profiles.map((p) => (
            <button key={p.id} className={`btn ${p.id === pid ? 'primary' : ''}`} onClick={() => setPid(p.id)}>
              <Emoji code={p.avatar} size={28} /> {p.name || 'Без имени'}
            </button>
          ))}
        </div>
      )}

      {profile && (
        <>
          <section className="card">
            <h2>Навыки</h2>
            <p className="note">
              Статус меняется по самостоятельным пробам без подсказок. «Уверенно» — не меньше трёх
              самостоятельных успехов в два разных дня. Это рабочие настройки пилота, а не диагноз.
            </p>
            <table className="report">
              {skillsByIsland.map(({ isl, skills }) => skills.length > 0 && (
                <tbody key={isl.id}>
                  <tr className="report-group"><th colSpan={3}>{isl.title} · {isl.ages}</th></tr>
                  {skills.map((s) => (
                    <tr key={s}>
                      <td>{s}</td>
                      <td>{SKILLS[s].title}</td>
                      <td className={`status ${skillStatus(own, s)}`}>{STATUS_TEXT[skillStatus(own, s)]}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </section>

          <section className="card">
            <h2>С какого острова начать</h2>
            <p className="note">
              Если ребёнок уже уверенно считает или учится в школе, откройте сразу нужный остров.
              Предыдущие острова останутся доступны для повторения. Внутри острова задания идут по порядку.
            </p>
            <ol className="islands-choice">
              {ISLANDS.map((isl, i) => (
                <li key={isl.id}>
                  <label className="toggle">
                    <input
                      type="radio"
                      name="start-island"
                      checked={(profile.startIsland ?? 0) === i}
                      onChange={() => onStartIsland(profile.id, i)}
                    />
                    <span><b>{isl.title}</b> ({isl.ages}). {isl.goal}</span>
                  </label>
                </li>
              ))}
            </ol>
          </section>

          <section className="card">
            <h2>Последние попытки</h2>
            {recent.length === 0 && <p>Ребёнок ещё не играл.</p>}
            <ul className="attempts">
              {recent.map((a) => (
                <li key={a.id}>
                  <span className={`mark ${a.correct ? 'ok' : 'no'}`}>{a.correct ? 'верно' : 'не получилось'}</span>
                  {' '}{MISSIONS.find((m) => m.id === a.missionId)?.title}, {VARIANT_TEXT[a.variant]},{' '}
                  {HELP_TEXT[a.helpLevel]}. <span className="muted">Ответ: {a.answer}. {fmt(a.at)}</span>
                </li>
              ))}
            </ul>
          </section>

          {homeIdeas.length > 0 && (
            <section className="card">
              <h2>Игры дома</h2>
              <ul>
                {homeIdeas.map((m) => <li key={m.id}><b>{m.title}:</b> {m.home}</li>)}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="card">
        <h2>Настройки</h2>
        <label className="toggle">
          <input type="checkbox" checked={data.settings.voice} onChange={(e) => onVoice(e.target.checked)} />
          Озвучивать задания
        </label>
        <p className="note">
          Сейчас задания читает голос браузера. Перед запуском фразы будут записаны заранее и проверены на слух.
        </p>
        {profile && (
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Удалить профиль и всю историю этого ребёнка на этом устройстве?')) onDeleteProfile(profile.id);
            }}
          >
            Удалить профиль «{profile.name || 'Без имени'}»
          </button>
        )}
        <p className="note">
          Все данные хранятся только в этом браузере. Приложение не собирает фото, голос и настоящие имена.
        </p>
        <button className="btn ghost" onClick={onCredits}>Авторство картинок и лицензии</button>
      </section>
    </div>
  );
}
