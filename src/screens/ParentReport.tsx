import { useState } from 'react';
import { ISLANDS } from '../content/levels';
import { getMission } from '../content/missions';
import { cardOutcomes, lastDays, MIN_SAMPLE, share, summarize } from '../engine/metrics';
import { DAY, isIndependentSuccess, isReviewDue, missionDone, probeReached, reviewDueAt } from '../engine/progress';
import type { Attempt, MissionSession } from '../engine/types';

interface Props {
  attempts: Attempt[];
  sessions: MissionSession[];
  stickers: string[];
  now: number;
}

const OUTCOME_ROWS = [
  ['independent', 'с первого раза без помощи'],
  ['afterError', 'без помощи, но после ошибки'],
  ['withHelp', 'с помощью'],
  ['unsolved', 'без верного ответа (ушли с карточки)'],
] as const;

const day = (ts: number) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

/** Отчёт взрослому: итоги периода, что пора повторить и почему, подробно по миссиям. Формулы — docs/progress-contract.md. */
export function ParentReport({ attempts, sessions, stickers, now }: Props) {
  const [days, setDays] = useState<7 | 30>(7);
  const [from, to] = lastDays(now, days);
  const s = summarize(attempts, sessions, from, to);
  const enough = s.tried >= MIN_SAMPLE;
  const due = ISLANDS.flatMap((i) => i.missions).filter((id) => isReviewDue(attempts, id, now));

  return (
    <>
      <section className="card" aria-labelledby="sum-h">
        <h2 id="sum-h">Итоги</h2>
        <div className="row wrap" role="group" aria-label="Период">
          {([7, 30] as const).map((d) => (
            <button key={d} aria-pressed={days === d} className={`btn ${days === d ? 'primary' : ''}`} onClick={() => setDays(d)}>
              {d} дней
            </button>
          ))}
        </div>
        {s.tried === 0 && s.sessionsStarted === 0 && s.activeDays === 0 ? (
          <p>За {days} дней занятий не было.</p>
        ) : (
          <>
            <p>
              Дней с занятиями: {s.activeDays} из {days}.
              Начато миссий: {s.sessionsStarted}, пройдено до конца: {s.sessionsFinished}.
              Показано карточек: {s.shown}, с ответом (без обучения): {s.tried}.
            </p>
            <table className="report">
              <caption className="note">Карточки с ответом за {days} дней ({s.tried})</caption>
              <tbody>
                {OUTCOME_ROWS.map(([k, label]) => {
                  const pct = share(s[k], s.tried);
                  return (
                    <tr key={k}>
                      <th scope="row" className="report-label">{label}</th>
                      <td>{s[k]}</td>
                      <td>{pct === null ? '' : `${pct}%`}</td>
                      <td className="bar-cell" aria-hidden="true">
                        {pct !== null && <span className={`bar ${k}`} style={{ width: `${pct}%` }} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!enough && <p className="note">Меньше {MIN_SAMPLE} ответов — проценты не считаем, выводы делать рано.</p>}
            {s.legacyAnswers > 0 && (
              <p className="note">Ещё {s.legacyAnswers} ответов записаны прошлой версией: они видны в истории, но в доли не входят.</p>
            )}
          </>
        )}
        <p className="note">
          «С первого раза» — верный ответ без подсказки и без ошибки перед ним. Учебные карточки («Учимся») не считаются.
          Это не оценка и не сравнение с другими детьми.
        </p>
      </section>

      <section className="card" aria-labelledby="due-h">
        <h2 id="due-h">Пора повторить</h2>
        {due.length === 0 ? <p>Сейчас повторять нечего.</p> : (
          <ul>
            {due.map((id) => {
              const last = attempts.filter((a) => a.missionId === id && isIndependentSuccess(a)).sort((a, b) => b.at - a.at)[0];
              const pause = Math.round((now - last.at) / DAY);
              return (
                <li key={id}>
                  <b>{getMission(id)!.title}</b>: последний самостоятельный успех {day(last.at)}, прошло {pause} дн.
                  Повтор через паузу проверяет, что умение держится.
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card" aria-labelledby="mis-h">
        <h2 id="mis-h">Миссии подробно</h2>
        {attempts.length === 0 && <p>Ни одна миссия ещё не начата.</p>}
        {ISLANDS.map((isl) => {
          const rows = isl.missions.filter((id) => attempts.some((a) => a.missionId === id));
          if (rows.length === 0) return null;
          return (
            <details key={isl.id}>
              <summary>{isl.title} · начато {rows.length} из {isl.missions.length}</summary>
              <table className="report">
                <thead>
                  <tr><th scope="col">Миссия</th><th scope="col">Где сейчас</th><th scope="col">С первого раза</th><th scope="col">Повтор</th></tr>
                </thead>
                <tbody>
                  {rows.map((id) => {
                    const own = attempts.filter((a) => a.missionId === id);
                    const cards = cardOutcomes(own.filter((a) => a.sessionId !== undefined)).filter((c) => c.outcome !== 'learning');
                    const first = cards.filter((c) => c.outcome === 'independent').length;
                    const where = missionDone(own, stickers, id) ? 'пройдена' : probeReached(own, id) ? 'самостоятельная проба' : 'обучение';
                    const next = reviewDueAt(own, id);
                    return (
                      <tr key={id}>
                        <td>{getMission(id)!.title}</td>
                        <td>{where}</td>
                        <td>{cards.length ? `${first} из ${cards.length}` : '—'}</td>
                        <td>{next === null ? '—' : next <= now ? 'пора' : day(next)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
      </section>
    </>
  );
}
