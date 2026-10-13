const KEY = 'synagogue_subscribers';

export function loadSubscribers() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function addSubscriber(name, phone, email) {
  const list = loadSubscribers();
  // Keep leading + for international format, strip other non-digits
  const cleanPhone = phone.startsWith('+') ? '+' + phone.slice(1).replace(/\D/g, '') : phone.replace(/\D/g, '');
  list.push({ id: Date.now(), name, phone: cleanPhone, email });
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function deleteSubscriber(id) {
  const list = loadSubscribers().filter(s => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function sendPosterToAll(posterText) {
  // Returns actions the user should take - actual sending is done manually
  const subs = loadSubscribers();
  return subs.map(s => ({
    ...s,
    whatsappUrl: `https://wa.me/${s.phone}?text=${encodeURIComponent(posterText)}`,
    mailtoUrl: `mailto:${s.email}?subject=${encodeURIComponent('מודעה מבית הכנסת')}&body=${encodeURIComponent(posterText)}`,
  }));
}