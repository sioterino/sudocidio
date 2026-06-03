self.addEventListener("push", (event) => {
  console.log("[SW] Push recebido!", event.data?.text());
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Sudocídio (Push)", {
      body: data.body ?? "O jogo começou!",
      icon: "/assets/npcs/SMW-A.png",
    })
  );
});