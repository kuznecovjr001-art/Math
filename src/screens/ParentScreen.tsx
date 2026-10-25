import { useRef, useState } from 'react';
import { ISLANDS } from '../content/levels';
import { getMission, MISSIONS } from '../content/missions';
import { SKILLS, STATUS_TEXT } from '../content/skills';
import { missionDone, skillStatus } from '../engine/progress';
import { brokenRecords, exportJson } from '../engine/storage';
import { saveTextFile } from '../platform/files';
import { isNative } from '../platform/native';
import type { AppData } from '../engine/types';
import { Emoji, Icon, SceneBg } from '../ui/art';

interface Props {
  data: AppData;
  onBack: () => void;
  onVoice: (on: boolean) => void;
  onDeleteProfile: (id: string) => void;
  onStartIsland: (id: string, island: number) => void;
  onCredits: () => void;
  /** false — файл не похож на резервную копию. */
  onImport: (text: string) => boolean;
}

const VARIANT_TEXT = { A: 'обучение', B: 'самостоятельная проба', C: 'повтор после паузы' };
const HELP_TEXT = ['без помощи', 'после вопроса-подсказки', 'с моделью', 'после разобранного примера'];

function fmt(ts: number) {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ParentScreen({ data, onBack, onVoice, onDeleteProfile, onStartIsland, onCredits, onImport }: Props) {
  const [pid, setPid] = useState(data.profiles[0]?.id ?? '');
  const [backupNote, setBackupNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [broken] = useState(() => {
    try { return brokenRecords(); } catch { return []; }
  });
  const profile = data.profiles.find((p) => p.id === pid);
  const own = data.attempts.filter((a) => a.profileId === pid);
  const recent = [...own].sort((a, b) => b.at - a.at).slice(0, 15);
  // Навыки по островам: каждый навык показываем там, где он встречается впервые.
  const seen = new Set<string>();
  const skillsByIsland = ISLANDS.map((isl) => {
    const list = isl.missions.map((id) => getMission(id)!.skill).filter((s) => !seen.has(s) && seen.add(s));
    return { isl, skills: [...new Set(list)] };
  });
  const homeIdeas = MISSIONS.filter((m) => missionDone(own, data.stickers[pid] ?? [], m.id));

  return (
    <div className="screen parent">
      <SceneBg name="parent" />
      <header className="parent-bar">
        <button className="btn" onClick={onBack}><Icon name="back" size={28} />К игре</button>
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
          Задания, подсказки и похвала записаны заранее. Карточки с новыми числами читает голос устройства
          {isNative
            ? ': на Android — системный синтез речи. Чтобы он работал без интернета, скачайте русский голос: Настройки → Система → Язык → Синтез речи.'
            : ' (синтез речи браузера).'}
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
        <h3>Резервная копия</h3>
        <p className="note">
          Файл со всеми профилями и историей. Восстановление добавляет недостающее и ничего не удаляет.
        </p>
        <div className="row wrap">
          <button
            className="btn"
            onClick={() => {
              const day = new Date().toISOString().slice(0, 10);
              saveTextFile(`schitalochka-${day}.json`, exportJson(data))
                .then(() => setBackupNote('Копия сохранена.'))
                .catch(() => setBackupNote('Не удалось сохранить копию.'));
            }}
          >
            Сохранить копию
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Восстановить из файла</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              f?.text()
                .then((t) => setBackupNote(onImport(t) ? 'Данные из файла добавлены.' : 'Это не файл копии «Считалочки».'))
                .catch(() => setBackupNote('Не удалось прочитать файл.'));
            }}
          />
        </div>
        {broken.length > 0 && (
          <button
            className="btn"
            onClick={() => saveTextFile('schitalochka-povrezhdennoe.json', JSON.stringify({ app: 'mathkids-broken', records: broken }))
              .then(() => setBackupNote('Повреждённое сохранение записано в файл.'))
              .catch(() => setBackupNote('Не удалось сохранить файл.'))}
          >
            Повреждённое сохранение в файл ({broken.length})
          </button>
        )}
        {backupNote && <p className="note" role="status">{backupNote}</p>}
        <button className="btn ghost" onClick={onCredits}>Авторство картинок и лицензии</button>
      </section>
    </div>
  );
}
