export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen parent">
      <header className="parent-bar">
        <button className="btn" onClick={onBack}>← Назад</button>
        <h1>Авторство</h1>
      </header>
      <section className="card">
        <p>
          Картинки животных, фруктов, подарка, поезда и звезды: <a href="https://openmoji.org/" target="_blank" rel="noreferrer">OpenMoji</a>,
          HfG Schwäbisch Gmünd и участники проекта, лицензия{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>, без изменений.
          {' '}<a href={`${import.meta.env.BASE_URL}licenses/openmoji-LICENSE.txt`} target="_blank" rel="noreferrer">Текст лицензии</a>.
        </p>
        <p>Чашки, ложки, тарелки, посылки и пассажиры нарисованы для этого приложения.</p>
      </section>
    </div>
  );
}
