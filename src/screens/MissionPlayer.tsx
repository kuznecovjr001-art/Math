import { useEffect, useMemo, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { speak, stopSpeaking } from '../audio/voice';
import { stickerArt } from '../content/art';
import { MISSION_SCENE } from '../content/scenes';
import { seededRng } from '../content/generate';
import { missionLength } from '../content/levels';
import { cardId, instruction, voiceText, type Mission } from '../content/missions';
import { buildSteps, type PlayMode } from '../content/steps';
import type { Attempt, HelpLevel, Mode, Variant } from '../engine/types';
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
import { Emoji, Guide, Icon, SceneBg, type GuidePose } from '../ui/art';

type NewAttempt = Omit<Attempt, 'id' | 'profileId' | 'at'>;

const MODE_OF: Record<Variant, Mode> = { A: 'learn', B: 'probe', C: 'review' };

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
  onFinish: () => void;
  onExit: () => void;
}

export function MissionPlayer({ mission, mode, onAttempt, onFinish, onExit }: Props) {
  // «Ещё разок» начинает новый заход: новые числа и только самостоятельные карточки.
  const [round, setRound] = useState({ mode, seed: Date.now() });
  const steps = useMemo(
    () => buildSteps(mission, round.mode, missionLength(mission.id), seededRng(round.seed)),
    [mission, round],
  );
  const [pos, setPos] = useState(0);
  const [help, setHelp] = useState<HelpLevel>(0);
  const [locked, setLocked] = useState(false);
  const [errors, setErrors] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  // Поза Счётика рядом с облачком: подсказывает, радуется или предлагает проверить.
  const [mood, setMood] = useState<GuidePose>('talk');
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const step = steps[pos];
  const text = instruction(step.params);
  const helpTexts = mission.helpFor?.(step.params) ?? mission.help;

  useEffect(() => {
    if (!done) speak(voiceText(text));
  }, [text, pos, done]);

  useEffect(() => () => stopSpeaking(), []);

  const raiseHelp = () => {
    if (help >= 3) return;
    const next = (help + 1) as HelpLevel;
    setHelp(next);
    speak(voiceText(helpTexts[next - 1]));
    setMessage(helpTexts[next - 1]);
    setMood('help');
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
    });

    const release = (ms: number, then?: () => void) =>
      setTimeout(() => {
        then?.();
        busy.current = false;
        setLocked(false);
      }, ms);

    if (r.correct && r.final === false) {
      sfx.good();
      const next = r.next ?? 'Верно! А теперь: сколько всего?';
      speak(next);
      setMessage(next);
      setMood('happy');
      release(600);
      return;
    }

    if (r.correct) {
      sfx.good();
      const praise = steps[pos + 1] ? 'Получилось!' : mission.praise;
      speak(praise);
      setMessage(praise);
      setMood('happy');
      release(1600, () => {
        setMessage(null);
        setErrors(0);
        setHelp(0);
        if (pos + 1 < steps.length) setPos(pos + 1);
        else {
          setDone(true);
          speak(`${mission.praise} ${mission.finish}`);
          onFinish();
        }
      });
      return;
    }

    sfx.soft();
    const nextErrors = errors + 1;
    setErrors(nextErrors);
    if (nextErrors >= 2 && help < 3) {
      release(900, raiseHelp);
    } else {
      speak('Давай проверим ещё раз.');
      setMessage('Давай проверим ещё раз.');
      setMood('think');
      release(900);
    }
  };

  const again = () => {
    setRound({ mode: 'again', seed: Date.now() });
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
          <Guide pose="happy" size={140} className="finish-guide" />
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
    <div className="screen mission">
      <SceneBg name={MISSION_SCENE[mission.id] ?? 'meadow'} />
      <header className="mission-bar">
        <button className="btn icon" onClick={onExit} aria-label="Домой"><Icon name="home" /></button>
        <div className="progress" aria-label={`Задание ${pos + 1} из ${steps.length}`}>
          {steps.map((s, i) => (
            <span key={i} className={`dot ${i < pos ? 'past' : i === pos ? 'now' : ''}`} title={STEP_TITLE[s.variant]} />
          ))}
        </div>
        <button className="btn icon" onClick={() => speak(voiceText(text))} aria-label="Повторить задание"><Icon name="sound" /></button>
        <button
          className={`btn icon help ${errors > 0 && help === 0 ? 'pulse' : ''}`}
          onClick={raiseHelp}
          disabled={help >= 3 || locked}
          aria-label="Помощь"
        >
          <Icon name="help" size={40} />
        </button>
      </header>
      <div className="task-row">
        <Guide pose={message ? mood : 'talk'} size={84} className="task-guide" />
        <div className="task-text">
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
