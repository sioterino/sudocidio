export function requestNotificationPermission(): void {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function notifyGameStart(): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const n = new Notification("Sudocídio", {
    body: "Um oponente foi encontrado — o caso começa agora!",
    icon: "/assets/npcs/SMW-A.png",
    tag: "game-start",
    silent: false,
    requireInteraction: true, // forces it to stay visible and not be suppressed
  });

  n.onclick = () => { window.focus(); n.close(); };
}