import { useEffect, useMemo, useRef, useState } from 'react';
import { PHRASE, PRAISE, pickPhrase, SUPPORT } from '../audio/phrases';
import { hasRecording, speak, speakAll, stopSpeaking, voiceReady } from '../audio/voice';
import { stickerArt } from '../content/art';
import { MISSION_SCENE } from '../content/scenes';
import { seededRng } from '../content/generate';
import { missionLength } from '../content/levels';
import { cardId, instruction, voiceParts, voiceText, type CardParams, type Mission } from '../content/missions';
import { buildSteps, type PlayMode } from '../content/steps';
import { newId } from '../engine/storage';
import type { Attempt, HelpLevel, MissionSession, Mode, Variant } from '../engine/types';
import { ArrayGame } from '../games/ArrayGame';
import { BasketGame } from '../games/BasketGame';
import { BoxesGame } from '../games/BoxesGame';
import { CompareGame } from '../games/CompareGame';
import { CountGame } from '../games/CountGame';
import { CupsGame } from '../games/CupsGame';
import { FactsGame } from '../games/FactsGame';
import { FingersGame } from '../games/FingersGame';
import { FlashGame } from '../games/FlashGame';
import { MeasureGame } from '../games/MeasureGame';
import { OrderGame } from '../games/OrderGame';
import { PatternGame } from '../games/PatternGame';
import { PositionGame } from '../games/PositionGame';
import { SortGame } from '../games/SortGame';
import { ZeroGame } from '../games/ZeroGame';
import { HiddenGame } from '../games/HiddenGame';
import { ParcelsGame } from '../games/ParcelsGame';
import { RecordGame } from '../games/RecordGame';
import { SeatsGame } from '../games/SeatsGame';
import { ShapesGame } from '../games/ShapesGame';
import { StoryGame } from '../games/StoryGame';
import { TenFrameGame } from '../games/TenFrameGame';
import { TensGame } from '../games/TensGame';
import { Beads100Game } from '../games/Beads100Game';
import { Chart100Game } from '../games/Chart100Game';
import { CoinsGame } from '../games/CoinsGame';
import { TallyGame } from '../games/TallyGame';
import { GroupsOfGame } from '../games/GroupsOfGame';
import { JumpsGame } from '../games/JumpsGame';
import { FractionGame } from '../games/FractionGame';
import { UnitsGame } from '../games/UnitsGame';
import { Complete100Game } from '../games/Complete100Game';
import { PlaceValueGame } from '../games/PlaceValueGame';
import { RiddleGame } from '../games/RiddleGame';
import { Compare3Game } from '../games/Compare3Game';
import { OpenLineGame } from '../games/OpenLineGame';
import { BarGame } from '../games/BarGame';
import { SymmetryGame } from '../games/SymmetryGame';
import { ClockGame } from '../games/ClockGame';
import { WeekGame } from '../games/WeekGame';
import { UnitPickGame } from '../games/UnitPickGame';
import type { GameResult } from '../games/types';
import { emit } from '../motion/events';
import { motionOff } from '../motion/flight';
import { Schetik } from '../motion/Schetik';
import { Emoji, Icon, SceneBg } from '../ui/art';

type NewAttempt = Omit<Attempt, 'id' | 'profileId' | 'at'>;

/** Карточка озвучена целиком: задание и подсказки к ней есть в записях голоса. */
const voiced = (m: Mission) => (p: CardParams) =>
  voiceParts(instruction(p)).every(hasRecording) && (m.helpFor?.(p) ?? []).every((h) => hasRecording(voiceText(h)));

const MODE_OF: Record<Variant, Mode> = { A: 'learn', B: 'probe', C: 'review' };
/** Пауза после фразы Счётика, прежде чем сменится карточка: фраза не обрывается на полуслове. */
const BREATH_MS = 350;
/** Уход карточки — как .screen.mission[data-leaving] в motion.css. */
const LEAVE_MS = 320;

const STEP_TITLE: Record<Variant, string> = {
  A: 'Учимся',
  B: 'Сам',
  C: 'Вспомним',
};

export type { PlayMode };

interface Props {
  mission: Mission;
  mode: PlayMode;
  onAttempt: (a: NewAttempt) => void;
  /** Заход в миссию: создаётся при старте, обновляется на каждой карточке и в конце. */
  onSession: (s: Omit<MissionSession, 'profileId'>) => void;
  onFinish: () => void;
  onExit: () => void;
}

export function MissionPlayer({ mission, mode, onAttempt, onSession, onFinish, onExit }: Props) {
  // «Ещё разок» начинает новый заход: новые числа и только самостоятельные карточки.
  const [round, setRound] = useState(() => ({ mode, seed: Date.now(), id: newId() }));
  const steps = useMemo(
    () => buildSteps(mission, round.mode, missionLength(mission.id), seededRng(round.seed), voiceReady() ? voiced(mission) : undefined),
    [mission, round],
  );
  const [pos, setPos] = useState(0);
  const [help, setHelp] = useState<HelpLevel>(0);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);
  const step = steps[pos];
  const text = instruction(step.params);
  const helpTexts = mission.helpFor?.(step.params) ?? mission.help;

  useEffect(() => {
    if (done) return;
    // Счётик сам решает, как реагировать (motion/character): здоровается на первой карточке, потом слушает.
    emit({ type: 'TASK_STARTED', first: pos === 0 });
    void speakAll(voiceParts(text), 150, 'question');
  }, [text, pos, done]);

  // Экран могли закрыть («Домой»), пока плеер ждал конца фразы: тогда ни речи, ни смены карточки.
  // Флаг ставится и при монтировании: StrictMode в разработке монтирует экран дважды, и без этого
  // после первой «смерти» карточки переставали бы сменяться.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; stopSpeaking(); };
  }, []);

  // После показа финиша: Счётик финишного экрана уже подписан на события и празднует.
  useEffect(() => { if (done) emit({ type: 'MISSION_COMPLETED' }); }, [done]);

  useEffect(() => {
    onSession({
      id: round.id, missionId: mission.id, mode: round.mode, startedAt: round.seed,
      cards: steps.length, shown: pos + 1, ...(done ? { finishedAt: Date.now() } : {}),
    });
    // Отчёт о заходе меняется только с карточкой и концом миссии.
  }, [round, pos, done]);

  const raiseHelp = () => {
    if (help >= 3) return;
    const next = (help + 1) as HelpLevel;
    setHelp(next);
    emit({ type: 'HELP_REQUESTED', level: next });
    void speak(voiceText(helpTexts[next - 1]), 'support');
    setMessage(helpTexts[next - 1]);
  };

  const submit = (r: GameResult) => {
    if (busy.current) return; // двойное нажатие не создаёт две попытки
    busy.current = true;
    setLocked(true);
    onAttempt({
      missionId: mission.id,
      cardId: cardId(mission, step.variant, step.index, step.generated),
      variant: step.variant,
      skill: mission.skill,
      mode: MODE_OF[step.variant],
      correct: r.correct,
      helpLevel: help,
      answer: r.answer,
      sessionId: round.id,
      step: pos,
      errorsBefore: errors,
      ...(r.final === false ? { partial: true as const } : {}),
    });

    /**
     * Ответ разблокируется, когда фраза договорена и после неё прошла короткая пауза, но не раньше min
     * (видна реакция). max — только страховка от зависшей записи; без звука или записи игра идёт дальше сама.
     */
    const release = (min: number, said: Promise<void> = Promise.resolve(), then?: () => void, max = 8000) => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      void Promise.all([wait(min), Promise.race([said.then(() => wait(BREATH_MS)), wait(max)])]).then(() => {
        if (!alive.current) return;
        then?.();
        busy.current = false;
        setLocked(false);
      });
    };

    if (r.correct && r.final === false) {
      emit({ type: 'ANSWER_CORRECT', final: false });
      const next = r.next ?? PHRASE.nextDefault;
      void speak(next, 'question');
      setMessage(next);
      release(600);
      return;
    }

    if (r.correct) {
      emit({ type: 'ANSWER_CORRECT', final: true });
      const praise = steps[pos + 1] ? pickPhrase(PRAISE) : mission.praise;
      setMessage(praise);
      // Разбор после ответа не обрывается: ждём его, даже если похвала короче (без движения — сразу дальше).
      const show = motionOff() ? 0 : r.showMs ?? 0;
      release(Math.max(700, show), speak(praise, 'praise'), () => {
        // Карточка сначала мягко уходит, потом появляется следующая (или финиш) — без резкой подмены.
        setLeaving(true);
        setTimeout(() => {
          if (!alive.current) return;
          setLeaving(false);
          setMessage(null);
          setErrors(0);
          setHelp(0);
          if (pos + 1 < steps.length) setPos(pos + 1);
          else {
            setDone(true);
            void speak(`${mission.praise} ${mission.finish}`, 'praise');
            onFinish();
          }
        }, motionOff() ? 0 : LEAVE_MS);
      });
      return;
    }

    emit({ type: 'ANSWER_INCORRECT' });
    const nextErrors = errors + 1;
    setErrors(nextErrors);
    if (nextErrors >= 2 && help < 3) {
      release(900, undefined, raiseHelp);
    } else {
      const support = pickPhrase(SUPPORT);
      setMessage(support);
      release(900, speak(support, 'support'));
    }
  };

  const again = () => {
    setRound({ mode: 'again', seed: Date.now(), id: newId() });
    setPos(0);
    setHelp(0);
    setErrors(0);
    setMessage(null);
    setDone(false);
  };

  if (done) {
    return (
      <div className="screen finish">
        <SceneBg name="finish" />
        <div className="finish-hero">
          <div className="sticker-burst"><Emoji code={stickerArt(mission)} size={140} /></div>
          <Schetik size={140} className="finish-guide" />
        </div>
        <h1>{mission.praise}</h1>
        <p className="lead">{mission.finish}</p>
        <p className="home-idea"><b>Для взрослых.</b> Игра дома: {mission.home}</p>
        <div className="finish-actions">
          <button className="btn big" onClick={again}>Ещё разок</button>
          <button className="btn primary big" onClick={onExit}>На карту</button>
        </div>
      </div>
    );
  }

  const gameProps = { help, locked, onSubmit: submit };
  const key = `${round.seed}-${pos}`;
  const p = step.params;

  return (
    <div
      className="screen mission"
      data-leaving={leaving || undefined}
      // Касание предмета в игре: Счётик просыпается и смотрит на действие (кнопки панели не считаются).
      onPointerDown={(e) => {
        if ((e.target as Element).closest('.game button, .game [draggable], .game .tap')) emit({ type: 'OBJECT_PICKED' });
      }}
    >
      <SceneBg name={MISSION_SCENE[mission.id] ?? 'meadow'} />
      <header className="mission-bar">
        <button className="btn icon" onClick={onExit} aria-label="Домой"><Icon name="home" /></button>
        <div className="progress" role="img" aria-label={`Задание ${pos + 1} из ${steps.length}`}>
          {steps.map((s, i) => (
            <span key={i} className={`dot ${i < pos ? 'past' : i === pos ? 'now' : ''}`} title={STEP_TITLE[s.variant]} />
          ))}
        </div>
        <button className="btn icon" onClick={() => { setReplay((n) => n + 1); void speakAll(voiceParts(text), 150, 'question'); }} aria-label="Повторить задание"><Icon name="sound" /></button>
        <button
          className={`btn icon help ${errors > 0 && help === 0 ? 'pulse' : ''}`}
          onClick={raiseHelp}
          disabled={help >= 3 || locked}
          aria-label="Помощь"
        >
          <Icon name="help" size={40} />
        </button>
      </header>
      <h1 className="sr-only">{mission.title}</h1>
      <div className="task-row">
        <Schetik size={84} className="task-guide" />
        {/* Повтор задания виден и без звука: текст мягко подсвечивается. Новая карточка объявляется читалке. */}
        <div className="task-text" aria-live="polite" key={`t${pos}-${replay}`} data-flash={replay > 0 || undefined}>
          <span className="step-tag">{step.variant === 'C' && <Icon name="review" size={16} />}{STEP_TITLE[step.variant]}</span>
          {text}
        </div>
      </div>
      {message && <div className="bubble" role="status">{message}</div>}
      {p.kind === 'cups' && <CupsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'basket' && <BasketGame key={key} params={p} {...gameProps} />}
      {p.kind === 'seats' && <SeatsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'parcels' && <ParcelsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'boxes' && <BoxesGame key={key} params={p} {...gameProps} />}
      {p.kind === 'count' && <CountGame key={key} params={p} {...gameProps} />}
      {p.kind === 'compare' && <CompareGame key={key} params={p} {...gameProps} />}
      {p.kind === 'hidden' && <HiddenGame key={key} params={p} {...gameProps} />}
      {p.kind === 'shapes' && <ShapesGame key={key} params={p} {...gameProps} />}
      {p.kind === 'tenframe' && <TenFrameGame key={key} params={p} {...gameProps} />}
      {p.kind === 'tens' && <TensGame key={key} params={p} {...gameProps} />}
      {p.kind === 'record' && <RecordGame key={key} params={p} {...gameProps} />}
      {p.kind === 'array' && <ArrayGame key={key} params={p} {...gameProps} />}
      {p.kind === 'facts' && <FactsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'story' && <StoryGame key={key} params={p} {...gameProps} />}
      {p.kind === 'position' && <PositionGame key={key} params={p} {...gameProps} />}
      {p.kind === 'sort' && <SortGame key={key} params={p} {...gameProps} />}
      {p.kind === 'pattern' && <PatternGame key={key} params={p} {...gameProps} />}
      {p.kind === 'flash' && <FlashGame key={key} params={p} {...gameProps} />}
      {p.kind === 'zero' && <ZeroGame key={key} params={p} {...gameProps} />}
      {p.kind === 'fingers' && <FingersGame key={key} params={p} {...gameProps} />}
      {p.kind === 'measure' && <MeasureGame key={key} params={p} {...gameProps} />}
      {p.kind === 'order' && <OrderGame key={key} params={p} {...gameProps} />}
      {p.kind === 'beads100' && <Beads100Game key={key} params={p} {...gameProps} />}
      {p.kind === 'chart100' && <Chart100Game key={key} params={p} {...gameProps} />}
      {p.kind === 'coins' && <CoinsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'tally' && <TallyGame key={key} params={p} {...gameProps} />}
      {p.kind === 'groupsOf' && <GroupsOfGame key={key} params={p} {...gameProps} />}
      {p.kind === 'jumps' && <JumpsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'fraction' && <FractionGame key={key} params={p} {...gameProps} />}
      {p.kind === 'units' && <UnitsGame key={key} params={p} {...gameProps} />}
      {p.kind === 'complete100' && <Complete100Game key={key} params={p} {...gameProps} />}
      {p.kind === 'placeValue' && <PlaceValueGame key={key} params={p} {...gameProps} />}
      {p.kind === 'riddle' && <RiddleGame key={key} params={p} {...gameProps} />}
      {p.kind === 'compare3' && <Compare3Game key={key} params={p} {...gameProps} />}
      {p.kind === 'openLine' && <OpenLineGame key={key} params={p} {...gameProps} />}
      {p.kind === 'bar' && <BarGame key={key} params={p} {...gameProps} />}
      {p.kind === 'symmetry' && <SymmetryGame key={key} params={p} {...gameProps} />}
      {p.kind === 'clock' && <ClockGame key={key} params={p} {...gameProps} />}
      {p.kind === 'week' && <WeekGame key={key} params={p} {...gameProps} />}
      {p.kind === 'unitPick' && <UnitPickGame key={key} params={p} {...gameProps} />}
    </div>
  );
}
