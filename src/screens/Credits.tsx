import { useState, type ReactNode } from 'react';
import { isNative } from '../platform/native';
import { Icon, SceneBg } from '../ui/art';

/** В Android-приложении ссылок наружу нет (детское офлайн-приложение): адрес показывается текстом. */
function Ext({ href, children }: { href: string; children: ReactNode }) {
  if (isNative) return <>{children} ({href.replace(/^https:\/\//, '').replace(/\/$/, '')})</>;
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Credits({ onBack }: { onBack: () => void }) {
  const [license, setLicense] = useState<string | null>(null);
  return (
    <div className="screen parent">
      <SceneBg name="parent" />
      <header className="parent-bar">
        <button className="btn" onClick={onBack}><Icon name="back" size={28} />Назад</button>
        <h1>Авторство</h1>
      </header>
      <section className="card">
        <p>
          Картинки животных, фруктов, игрушек, предметов и времени суток: <Ext href="https://openmoji.org/">OpenMoji</Ext>,
          HfG Schwäbisch Gmünd и участники проекта, лицензия{' '}
          <Ext href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</Ext>, без изменений.
        </p>
        <details
          onToggle={(e) => {
            if ((e.target as HTMLDetailsElement).open && license === null) {
              fetch(`${import.meta.env.BASE_URL}licenses/openmoji-LICENSE.txt`)
                .then((r) => r.text()).then(setLicense).catch(() => setLicense('Файл лицензии не найден.'));
            }
          }}
        >
          <summary>Текст лицензии OpenMoji</summary>
          <pre className="license">{license ?? '…'}</pre>
        </details>
        <p>Фоны, черепашка Счётик, звери, предметы, эмблемы и наклейки — комплект рисунков «Остров счёта», сделанный для этого приложения. Где своего рисунка пока нет, показывается картинка OpenMoji или простой рисунок в коде (стол, руки, весы, бусы).</p>
        <p>Шрифт Nunito — The Nunito Project Authors, лицензия SIL Open Font License 1.1 (файл licenses/nunito-OFL.txt в приложении).
          Программные библиотеки React и Capacitor — лицензия MIT.</p>
        <p>Голос Счётика записан заранее моделью синтеза речи <Ext href="https://github.com/QwenLM/Qwen3-TTS">Qwen3-TTS</Ext> (Alibaba Qwen, лицензия Apache-2.0). Голос создан по описанию и не повторяет голос реального человека. Все фразы, включая задания с новыми числами, звучат этим голосом.</p>
      </section>
    </div>
  );
}
