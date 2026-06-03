self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Sudocídio", {
      body: data.body ?? "O jogo começou!",
      icon: "/assets/npcs/SMW-A.png",
    })
  );
});