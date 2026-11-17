const KEY = 'ritm-habits-v1';
const defaults = { healthTime: '17:00', devopsTime: '20:00', completed: {} };
let state = JSON.parse(localStorage.getItem(KEY) || 'null') || defaults;
state = { ...defaults, ...state, completed: state.completed || {} };

const $ = selector => document.querySelector(selector);
const dateKey = date => date.toISOString().slice(0, 10);
const todayKey = () => dateKey(new Date());
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 2600);
}

function render() {
  const now = new Date();
  $('#todayDate').innerHTML = `${days[now.getDay()]}<br><strong>${now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</strong>`;
  $('#healthTime').value = state.healthTime;
  $('#devopsTime').value = state.devopsTime;
  $('#healthTimeLabel').textContent = state.healthTime;
  $('#devopsTimeLabel').textContent = state.devopsTime;

  const done = state.completed[todayKey()] || {};
  const count = ['health', 'devops'].filter(task => done[task]).length;
  const percent = count * 50;
  $('#progressText').textContent = `${count} из 2 выполнено`;
  $('#progressPercent').textContent = `${percent}%`;
  $('#progressRing').style.background = `conic-gradient(var(--lime) ${percent * 3.6}deg, #5c7466 0deg)`;
  $('#progressRing').setAttribute('aria-label', `${percent} процентов`);
  document.querySelectorAll('[data-task]').forEach(button => {
    const isDone = !!done[button.dataset.task];
    button.classList.toggle('done', isDone);
    button.textContent = isDone ? '✓ Выполнено' : 'Готово';
  });
  renderWeek();
  renderStreak();
}

function renderWeek() {
  const now = new Date();
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - mondayOffset);
  $('#week').innerHTML = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday); date.setDate(monday.getDate() + index);
    const done = state.completed[dateKey(date)] || {};
    const isToday = dateKey(date) === todayKey();
    return `<div class="day ${isToday ? 'today' : ''}"><div class="day-name">${days[date.getDay()]}</div><div class="day-date">${date.getDate()}</div><div class="dots"><i class="dot ${done.health ? 'yes' : ''}"></i><i class="dot ${done.devops ? 'yes' : ''}"></i></div></div>`;
  }).join('');
}

function renderStreak() {
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const done = state.completed[dateKey(cursor)] || {};
    if (!done.health && !done.devops) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  $('#streak').textContent = `🔥 ${streak} ${plural(streak, 'день', 'дня', 'дней')} подряд`;
}

function plural(n, one, few, many) { const mod10 = n % 10, mod100 = n % 100; return mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14) ? few : many; }

function complete(task) {
  const key = todayKey();
  state.completed[key] = state.completed[key] || {};
  state.completed[key][task] = !state.completed[key][task];
  save(); render();
  toast(state.completed[key][task] ? 'Отмечено. Хорошая работа!' : 'Отметка снята');
}

function openModal(kind) {
  const content = $('#modalContent');
  if (kind === 'exercises') {
    content.innerHTML = `<p class="section-label">ЗДОРОВЬЕ · 8–10 МИНУТ</p><h2>Шея и осанка</h2><p class="small-note">Двигайся медленно и без боли. Если боль, онемение, головокружение или есть травма — остановись и обратись к врачу.</p>
      <div class="exercise"><h3>1. Подбородок назад · 8 раз</h3><p>Смотри прямо. Не наклоняя голову, мягко уведи подбородок назад, будто делаешь «двойной подбородок». Задержись на 3 секунды и расслабься.</p><a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=chin+tuck+exercise+physical+therapy">Открыть видео-показ ↗</a></div>
      <div class="exercise"><h3>2. Сведение лопаток · 10 раз</h3><p>Сядь или встань ровно. Опусти плечи, мягко сведи лопатки друг к другу. Не поднимай плечи к ушам. Задержись на 3 секунды.</p><a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=scapular+retraction+exercise+physical+therapy">Открыть видео-показ ↗</a></div>
      <div class="exercise"><h3>3. Растяжка груди у дверного проёма · 30 сек × 2</h3><p>Поставь предплечье на косяк, сделай небольшой шаг вперёд до мягкого растяжения груди. Дыши ровно, не пружинь.</p><a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=doorway+chest+stretch+physical+therapy">Открыть видео-показ ↗</a></div>`;
  } else {
    content.innerHTML = `<p class="section-label">DEVOPS · СЕГОДНЯ</p><h2>Практика без спешки</h2>
      <div class="lesson"><strong>1. Теория · 15 минут</strong><p>Повтори: файловая система Linux, абсолютные и относительные пути, права доступа.</p></div>
      <div class="lesson"><strong>2. Практика · 25 минут</strong><p>Создай учебную папку, потренируй навигацию, просмотр файлов и права. Запиши, что было непонятно.</p></div>
      <div class="lesson"><strong>3. Итог · 5 минут</strong><p>Сформулируй своими словами три команды, которые запомнил. Завтра продолжишь с нового маленького шага.</p></div>`;
  }
  $('#modal').showModal();
}

function scheduleCheck() {
  setInterval(() => {
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const tasks = [{ id: 'health', time: state.healthTime, title: 'Время разминки', body: 'Шея и осанка — 8–10 минут.' }, { id: 'devops', time: state.devopsTime, title: 'Время DevOps', body: 'Открой короткую практику на сегодня.' }];
    tasks.filter(task => task.time === time && !(state.completed[todayKey()] || {})[task.id]).forEach(task => new Notification(task.title, { body: task.body }));
  }, 30000);
}

function toICSDate(time) {
  const [hour, minute] = time.split(':');
  return `19700101T${hour}${minute}00`;
}
function exportCalendar() {
  const event = (title, time) => `BEGIN:VEVENT\nUID:${title.replaceAll(' ', '-')}-ritm\nDTSTART:${toICSDate(time)}\nRRULE:FREQ=DAILY\nSUMMARY:${title}\nDESCRIPTION:Напоминание из трекера Ритм\nBEGIN:VALARM\nTRIGGER:-PT0M\nACTION:DISPLAY\nDESCRIPTION:${title}\nEND:VALARM\nEND:VEVENT`;
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Ритм//RU\n${event('Осанка и шея', state.healthTime)}\n${event('DevOps-практика', state.devopsTime)}\nEND:VCALENDAR`;
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'ritm-reminders.ics' }); link.click(); URL.revokeObjectURL(url);
  toast('Файл календаря скачан — открой его и добавь события.');
}

document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', () => complete(button.dataset.task)));
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.open)));
$('#closeModal').addEventListener('click', () => $('#modal').close());
$('#resetToday').addEventListener('click', () => { delete state.completed[todayKey()]; save(); render(); toast('Отметки за сегодня сброшены'); });
['healthTime', 'devopsTime'].forEach(id => $(`#${id}`).addEventListener('change', event => { state[id] = event.target.value; save(); render(); toast('Время сохранено'); }));
$('#enableNotifications').addEventListener('click', async () => {
  if (!('Notification' in window)) return toast('Этот браузер не поддерживает уведомления.');
  const result = await Notification.requestPermission();
  $('#notificationNote').textContent = result === 'granted' ? 'Уведомления включены, пока приложение открыто или работает в фоне.' : 'Разрешение не выдано. Используй календарь для надёжных напоминаний.';
  toast(result === 'granted' ? 'Уведомления включены' : 'Уведомления не разрешены');
});
$('#calendarExport').addEventListener('click', exportCalendar);
$('#exportData').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'ritm-progress.json' }); link.click(); URL.revokeObjectURL(url);
});
$('#importData').addEventListener('change', event => {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = () => { try { state = { ...defaults, ...JSON.parse(reader.result) }; save(); render(); toast('Прогресс восстановлен'); } catch { toast('Не удалось прочитать этот файл'); } }; reader.readAsText(file);
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
render(); scheduleCheck();
