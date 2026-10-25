import { Icon, SceneBg } from '../ui/art';

export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen parent">
      <SceneBg name="parent" />
      <header className="parent-bar">
        <button className="btn" onClick={onBack}><Icon name="back" size={28} />Назад</button>
        <h1>Авторство</h1>
      </header>
      <section className="card">
        <p>
          Картинки животных, фруктов, игрушек, предметов и времени суток: <a href="https://openmoji.org/" target="_blank" rel="noreferrer">OpenMoji</a>,
          HfG Schwäbisch Gmünd и участники проекта, лицензия{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>, без изменений.
          {' '}<a href={`${import.meta.env.BASE_URL}licenses/openmoji-LICENSE.txt`} target="_blank" rel="noreferrer">Текст лицензии</a>.
        </p>
        <p>Фоны, черепашка Счётик, звери, предметы, эмблемы и наклейки — комплект рисунков «Остров счёта», сделанный для этого приложения. Где своего рисунка пока нет, показывается картинка OpenMoji или простой рисунок в коде (стол, руки, весы, бусы).</p>
      </section>
    </div>
  );
}
