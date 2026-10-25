import { useState } from 'react';
import type { Profile } from '../engine/types';
import { Emoji, Icon } from '../ui/art';

export const AVATARS = ['1F431', '1F436', '1F430', '1F43B', '1F98A', '1F994', '1F43C', '1F427', '1F989', '1F42D'];

interface Props {
  profiles: Profile[];
  onPick: (id: string) => void;
  onCreate: (name: string, avatar: string) => void;
  onParent: () => void;
}

export function Profiles({ profiles, onPick, onCreate, onParent }: Props) {
  const [adding, setAdding] = useState(profiles.length === 0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [name, setName] = useState('');

  if (adding) {
    return (
      <div className="screen profiles">
        <h1>Кто будет играть?</h1>
        <p className="lead">Выберите картинку. Её ребёнок будет нажимать, чтобы войти: пароль не нужен.</p>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={`tap avatar ${a === avatar ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}
              aria-pressed={a === avatar}
            >
              <Emoji code={a} size={72} />
            </button>
          ))}
        </div>
        <label className="field">
          Имя или прозвище (необязательно)
          <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="Например, Маша" />
        </label>
        <div className="row">
          {profiles.length > 0 && <button className="btn" onClick={() => setAdding(false)}>Назад</button>}
          <button
            className="btn primary big"
            onClick={() => {
              onCreate(name.trim(), avatar);
              setAdding(false);
              setName('');
            }}
          >
            Готово
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen profiles">
      <button className="btn ghost corner" onClick={onParent}>Для взрослых</button>
      <h1>Кто играет?</h1>
      <div className="avatar-grid">
        {profiles.map((p) => (
          <button key={p.id} className="tap avatar big" onClick={() => onPick(p.id)}>
            <Emoji code={p.avatar} size={96} />
            {p.name && <span className="avatar-name">{p.name}</span>}
          </button>
        ))}
        {profiles.length < 6 && (
          <button className="tap avatar add" onClick={() => setAdding(true)} aria-label="Добавить ребёнка"><Icon name="plus" size={56} /></button>
        )}
      </div>
    </div>
  );
}
