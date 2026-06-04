// MiTanda UI string dictionary — Spanish (default) + English.
// Keys are referenced via useT()/t("key", { vars }). {var} placeholders are
// interpolated. "tanda"/"tandas" stays as the product noun in both languages.

export type Lang = "es" | "en";

export const dict = {
  // ── common ──────────────────────────────────────────────────────────────
  "common.signIn": { es: "Iniciar sesión", en: "Sign in" },
  "common.done": { es: "Listo", en: "Done" },
  "common.gotIt": { es: "Entendido", en: "Got it" },
  "common.viewTx": { es: "Ver transacción", en: "View transaction" },
  "common.switchTo": { es: "Cambiar a {chain}", en: "Switch to {chain}" },
  "common.confirmWallet": { es: "Confirma en tu wallet…", en: "Confirm in your wallet…" },
  "common.backToDashboard": { es: "Volver al panel", en: "Back to dashboard" },
  "common.you": { es: "Tú", en: "You" },
  "common.checking": { es: "Verificando…", en: "Checking…" },
  "common.connectToContinue": {
    es: "Conecta tu wallet (arriba a la derecha) para continuar.",
    en: "Connect your wallet (top right) to continue.",
  },
  "common.readyToClaim": { es: "{amt} {sym} listo para reclamar", en: "{amt} {sym} ready to claim" },

  // ── nav / app bar ───────────────────────────────────────────────────────
  "nav.dashboard": { es: "Panel", en: "Dashboard" },
  "nav.discover": { es: "Descubrir", en: "Discover" },
  "nav.passes": { es: "Mis pases", en: "My passes" },

  // ── connect button ──────────────────────────────────────────────────────
  "connect.connectedWallet": { es: "Wallet conectada", en: "Connected wallet" },
  "connect.copyAddress": { es: "Copiar dirección", en: "Copy address" },
  "connect.copied": { es: "¡Copiado!", en: "Copied!" },
  "connect.disconnect": { es: "Desconectar", en: "Disconnect" },
  "connect.editPhoto": { es: "Editar foto de perfil", en: "Edit profile photo" },

  // ── tanda status ────────────────────────────────────────────────────────
  "status.filling": { es: "Llenándose", en: "Filling" },
  "status.active": { es: "Activa", en: "Active" },
  "status.completed": { es: "Completada", en: "Completed" },

  // ── dashboard ───────────────────────────────────────────────────────────
  "dash.overview": { es: "Resumen", en: "Overview" },
  "dash.cycles": { es: "Ciclos", en: "Cycles" },
  "dash.paid": { es: "Pagado", en: "Paid" },
  "dash.activeStat": { es: "Activas", en: "Active" },
  "dash.upToDate": { es: "Al día", en: "Up to date" },
  "dash.nextPaymentDue": { es: "Próximo pago", en: "Next payment due" },
  "dash.yourTandas": { es: "Tus tandas", en: "Your tandas" },
  "dash.total": { es: "{n} en total", en: "{n} total" },
  "dash.startCircle": { es: "Inicia un nuevo círculo", en: "Start a new circle" },
  "dash.startCircleBody": {
    es: "Define el monto e invita a tu gente.",
    en: "Set the amount and invite your people.",
  },
  "dash.joinIdInvite": { es: "Únete con un ID o invitación", en: "Join with an ID or invite" },
  "dash.joinIdInviteBody": {
    es: "¿Tienes un ID de tanda o un enlace de invitación? Únete aquí.",
    en: "Have a tanda ID or invite link? Join here.",
  },
  "dash.signInTitle": { es: "Inicia sesión para empezar", en: "Sign in to get started" },
  "dash.signInBody": {
    es: "Inicia sesión para ver tus tandas, pagos y progreso — o explora los círculos abiertos abajo y únete a uno.",
    en: "Sign in to see your tandas, payments, and progress — or browse the open circles below and join one.",
  },
  "dash.noTandasTitle": { es: "Aún no tienes tandas", en: "No tandas yet" },
  "dash.noTandasBody": {
    es: "Aún no tienes tandas — crea una para empezar, únete con una invitación o elige un círculo abierto abajo.",
    en: "You don't have any tandas yet — create one to get started, join one with an invite, or pick an open circle below.",
  },
  "dash.netErrTitle": { es: "No pudimos conectar con la red", en: "Couldn't reach the network" },
  "dash.netErrBody": {
    es: "No pudimos leer tus tandas de {chain}. Revisa tu conexión e inténtalo de nuevo.",
    en: "We couldn't read your tandas from {chain}. Check your connection and try again.",
  },

  // due labels
  "due.allPaid": { es: "Todo pagado", en: "All paid up" },
  "due.overdue": { es: "Atrasado", en: "Overdue" },
  "due.inHour": { es: "Vence en {n} hora", en: "Due in {n} hour" },
  "due.inHours": { es: "Vence en {n} horas", en: "Due in {n} hours" },
  "due.inDay": { es: "Vence en {n} día", en: "Due in {n} day" },
  "due.inDays": { es: "Vence en {n} días", en: "Due in {n} days" },

  // ── tanda summary card ──────────────────────────────────────────────────
  "card.contributionPerRound": { es: "Aportación por ronda", en: "Contribution per round" },
  "card.payout": { es: "Pago", en: "Payout" },
  "card.yourStatus": { es: "Tu estado", en: "Your status" },
  "card.activeMember": { es: "Miembro activo", en: "Active member" },
  "card.member": { es: "Miembro", en: "Member" },
  "card.roundsPaidOut": { es: "Rondas pagadas", en: "Rounds paid out" },
  "card.paidUp": { es: "Estás al día", en: "You're paid up" },
  "card.waitingFill": { es: "Esperando a que se llene el círculo", en: "Waiting for the circle to fill" },
  "card.viewCircle": { es: "Ver círculo", en: "View circle" },

  // ── discovery strip ─────────────────────────────────────────────────────
  "discover.title": { es: "Tandas públicas para unirte", en: "Public tandas you can join" },
  "discover.subtitle": {
    es: "Círculos abiertos con lugares disponibles — cualquiera puede unirse.",
    en: "Open circles with seats still available — anyone can join.",
  },
  "discover.errTitle": { es: "No pudimos cargar las tandas abiertas", en: "Couldn't load open tandas" },
  "discover.errBody": {
    es: "No pudimos leer las tandas abiertas en este momento. Revisa tu conexión e inténtalo de nuevo.",
    en: "We couldn't read open tandas from the network just now. Check your connection and try again.",
  },
  "discover.emptyTitle": { es: "No hay tandas abiertas ahora mismo", en: "No open tandas right now" },
  "discover.emptyBody": {
    es: "Sé el primero — crea una tanda e invita a tu círculo.",
    en: "Be the first — create a tanda and invite your circle to join.",
  },
  "discover.yours": { es: "Tuya", en: "Yours" },
  "discover.joined": { es: "Unido", en: "Joined" },
  "discover.left": { es: "{n} libres", en: "{n} left" },
  "discover.contribution": { es: "Aportación", en: "Contribution" },
  "discover.perRound": { es: "por ronda", en: "per round" },
  "discover.seatsFilled": { es: "Lugares ocupados", en: "Seats filled" },
  "discover.inCircle": { es: "en el círculo", en: "in the circle" },
  "discover.joinCircle": { es: "Unirme", en: "Join circle" },
  "discover.view": { es: "Ver", en: "View" },

  // ── tanda room ──────────────────────────────────────────────────────────
  "room.notFoundTitle": { es: "Tanda no encontrada", en: "Tanda not found" },
  "room.notFoundBody": {
    es: "No encontramos una tanda con ese número.",
    en: "We couldn't find a tanda with that number.",
  },
  "room.errTitle": { es: "No pudimos cargar esta tanda", en: "Couldn't load this tanda" },
  "room.errBody": {
    es: "No pudimos leerla de la red en este momento. Revisa tu conexión e inténtalo de nuevo.",
    en: "We couldn't read it from the network just now. Check your connection and try again.",
  },
  "room.private": { es: "Privada", en: "Private" },
  "room.perCycle": { es: "Por ciclo", en: "Per cycle" },
  "room.potSize": { es: "Bote total", en: "Pot size" },
  "room.payout": { es: "Pago", en: "Payout" },
  "room.progress": { es: "Progreso", en: "Progress" },
  "room.seatsFilled": { es: "{n} de {m} lugares ocupados", en: "{n} of {m} seats filled" },
  "room.cycleOf": { es: "Ciclo {x} de {n}", en: "Cycle {x} of {n}" },
  "room.roundsComplete": { es: "{n} de {n} rondas completadas", en: "{n} of {n} rounds complete" },
  "room.fillsTitle": { es: "Se llena y luego empieza", en: "Fills, then starts" },
  "room.fillsBody": {
    es: "Cuando se ocupe el último lugar, se define el orden de pago y empieza la ronda 1.",
    en: "Once the last seat is filled, the payout order is set and round 1 begins.",
  },
  "room.completeTitle": { es: "Todas las rondas completadas", en: "All rounds complete" },
  "room.completeBody": {
    es: "Cada miembro recibió el bote. Este círculo terminó.",
    en: "Every member has received the pot. This circle is finished.",
  },
  "room.theirTurn": { es: "Es su turno · ciclo {x} de {n}", en: "It's their turn · cycle {x} of {n}" },
  "room.settingOrder": { es: "Definiendo el orden…", en: "Setting the order…" },
  "room.yourParticipation": { es: "Tu participación", en: "Your participation" },
  "room.partOpen": {
    es: "Estás dentro. Los pagos se habilitan cuando el círculo se llena y empieza.",
    en: "You're in. Payments open once the circle fills and starts.",
  },
  "room.partPaidUp": { es: "Estás al día por ahora.", en: "You're all paid up for now." },
  "room.partOwe": { es: "Debes el ciclo {n} — {amt} {sym}.", en: "You owe cycle {n} — {amt} {sym}." },
  "room.members": { es: "Miembros", en: "Members" },
  "room.round": { es: "Ronda {n}", en: "Round {n}" },
  "room.orderTBD": { es: "Orden por definir", en: "Order TBD" },
  "room.removed": { es: "Removido", en: "Removed" },
  "room.gotPot": { es: "Recibió el bote", en: "Got the pot" },
  "room.upNext": { es: "Sigue", en: "Up next" },
  "room.paid": { es: "Pagó", en: "Paid" },
  "room.pastGrace": { es: "Venció la gracia", en: "Past grace" },
  "room.due": { es: "Pendiente", en: "Due" },
  "room.openSeat": { es: "Lugar libre", en: "Open seat" },
  "room.paymentsByRound": { es: "Pagos por ronda", en: "Payments by round" },
  "room.gridOpenBody": {
    es: "La tabla de quién pagó y quién recibió cada ronda aparece cuando el círculo se llena y se define el orden.",
    en: "The grid of who paid and who received each round appears once the circle fills and the payout order is set.",
  },
  "room.gridSubtitle": {
    es: "Cada fila es un miembro; cada columna una ronda. Un regalo marca quién recibe el bote esa ronda.",
    en: "Each row is a member; each column a round. A gift marks who receives the pot that round.",
  },
  "room.member": { es: "Miembro", en: "Member" },
  "room.legendReceived": { es: "Recibió el bote", en: "Received pot" },
  "room.legendDue": { es: "Pendiente / atrasado", en: "Due / behind" },
  "room.chatTitle": { es: "Chat del grupo", en: "Member chat" },
  "room.chatSoon": { es: "Próximamente", en: "Coming soon" },
  "room.chatBody": {
    es: "Aquí vivirá un chat privado para este círculo.",
    en: "A private group chat for this circle will live here.",
  },
  "room.joinTitle": { es: "Únete a este círculo", en: "Join this circle" },
  "room.notMemberTitle": { es: "No eres miembro de esta tanda", en: "You're not a member of this tanda" },
  "room.joinBody": {
    es: "{n} lugares libres — aporta {amt} {sym} cada ronda y llévate el bote cuando sea tu turno.",
    en: "{n} seats left — contribute {amt} {sym} each round and take home the pot when it's your turn.",
  },
  "room.joinBodyOne": {
    es: "1 lugar libre — aporta {amt} {sym} cada ronda y llévate el bote cuando sea tu turno.",
    en: "1 seat left — contribute {amt} {sym} each round and take home the pot when it's your turn.",
  },
  "room.notOpenBody": {
    es: "Esta tanda ya empezó o terminó, así que no admite nuevos miembros.",
    en: "This tanda has already started or finished, so it's not open to new members.",
  },
  "room.privateBody": {
    es: "Esta es una tanda privada — necesitas una invitación para unirte.",
    en: "This is a private tanda — you need an invite to join.",
  },
  "room.fullBody": { es: "Esta tanda está llena.", en: "This tanda is full." },

  // ── interval labels ─────────────────────────────────────────────────────
  "interval.weekly": { es: "Semanal", en: "Weekly" },
  "interval.biweekly": { es: "Quincenal", en: "Biweekly" },
  "interval.monthly": { es: "Mensual", en: "Monthly" },
  "interval.everyNDays": { es: "Cada {n} días", en: "Every {n} days" },
  "interval.everyNHours": { es: "Cada {n} h", en: "Every {n}h" },

  // ── claim ───────────────────────────────────────────────────────────────
  "claim.claimed": { es: "¡Reclamado!", en: "Claimed!" },
  "claim.claiming": { es: "Reclamando…", en: "Claiming…" },
  "claim.claimAmt": { es: "Reclamar {amt}", en: "Claim {amt}" },
  "claim.readyTitle": { es: "Tu pago está listo", en: "Your payout is ready" },
  "claim.readyBodyOne": {
    es: "Tienes fondos listos para reclamar — toca para enviarlos a tu wallet.",
    en: "You have funds ready to claim — tap to send them to your wallet.",
  },
  "claim.readyBodyMany": {
    es: "Tienes fondos listos para reclamar en {n} tandas.",
    en: "You have funds ready to claim across {n} tandas.",
  },
  "claim.tandaReady": { es: "{amt} {sym} listo", en: "{amt} {sym} ready" },

  // ── release ─────────────────────────────────────────────────────────────
  "release.readyTitle": { es: "Tu pago está listo", en: "Your payout is ready" },
  "release.readyBody": {
    es: "Es tu turno en la Tanda #{id} (ciclo {cycle}). Libera este ciclo y te enviaremos {amt} directo a tu wallet.",
    en: "It's your turn for Tanda #{id} (cycle {cycle}). Release this cycle and we'll send {amt} straight to your wallet.",
  },
  "release.confirmRelease": { es: "Confirma la liberación en tu wallet…", en: "Confirm release in your wallet…" },
  "release.releasing": { es: "Liberando tu pago…", en: "Releasing your payout…" },
  "release.confirmClaim": { es: "Confirma el reclamo en tu wallet…", en: "Confirm claim in your wallet…" },
  "release.sending": { es: "Enviando a tu wallet…", en: "Sending to your wallet…" },
  "release.releaseClaim": { es: "Liberar y reclamar {amt}", en: "Release & claim {amt}" },
  "release.cycleReadyTitle": { es: "El pago de este ciclo está listo", en: "This cycle's payout is ready" },
  "release.cycleReadyBody": {
    es: "La Tanda #{id} ciclo {cycle} puede pagarse{to} ({amt}). Cualquiera puede liberarlo — ellos lo reclaman.",
    en: "Tanda #{id} cycle {cycle} can be paid out{to} ({amt}). Anyone can release it — they'll claim it themselves.",
  },
  "release.toAddr": { es: " a {addr}", en: " to {addr}" },
  "release.releaseBtn": { es: "Liberar el pago de este ciclo", en: "Release this cycle's payout" },
  "release.releasing2": { es: "Liberando…", en: "Releasing…" },
  "release.released": { es: "Pago liberado", en: "Payout released" },

  // ── defaulter ───────────────────────────────────────────────────────────
  "def.holdTitle": { es: "Un pago está deteniendo el reparto", en: "A payment is holding up the payout" },
  "def.waitTitle": { es: "Esperando un pago", en: "Waiting on a payment" },
  "def.holdBody": {
    es: "La Tanda #{id} ciclo {cycle} no puede pagarse hasta que todos aporten. El periodo de gracia terminó — puedes intervenir para que siga avanzando. Su depósito de seguro cubre el faltante, así los miembros honestos quedan completos.",
    en: "Tanda #{id} cycle {cycle} can't pay out until everyone's paid in. The grace period has passed — you can step in to keep things moving. Their insurance deposit covers the shortfall, so the honest members stay whole.",
  },
  "def.waitBody": {
    es: "La Tanda #{id} ciclo {cycle} no puede pagarse hasta que todos aporten. Dales un poco más de tiempo antes de que alguien intervenga.",
    en: "Tanda #{id} cycle {cycle} can't pay out until everyone's paid in. Give them a little longer to pay before anyone needs to step in.",
  },
  "def.missed": {
    es: "{addr} no pagó el ciclo {cycle} y el periodo de gracia terminó.",
    en: "{addr} missed cycle {cycle} and the grace period has passed.",
  },
  "def.markBtn": { es: "Marcar a {addr} como moroso", en: "Mark {addr} as defaulter" },
  "def.marking": { es: "Marcando…", en: "Marking…" },
  "def.waiting": {
    es: "Esperando que {addr} pague el ciclo {cycle} — la gracia termina {when}.",
    en: "Waiting on {addr} to pay cycle {cycle} — grace period ends {when}.",
  },
  "grace.now": { es: "ahora", en: "now" },
  "grace.inMin": { es: "en {n} min", en: "in {n} min" },
  "grace.inHour": { es: "en {n} hora", en: "in {n} hour" },
  "grace.inHours": { es: "en {n} horas", en: "in {n} hours" },
  "grace.inDay": { es: "en {n} día", en: "in {n} day" },
  "grace.inDays": { es: "en {n} días", en: "in {n} days" },

  // ── profile dialog ──────────────────────────────────────────────────────
  "profile.title": { es: "Tu perfil", en: "Your profile" },
  "profile.desc": {
    es: "Para que tu círculo te reconozca. Se guarda fuera de la cadena, ligado a tu wallet — firmas una vez para confirmar que eres tú.",
    en: "So your circle can recognize you. Stored off-chain, keyed to your wallet — you sign once to confirm it's you.",
  },
  "profile.choosePhoto": { es: "Elegir una foto", en: "Choose a photo" },
  "profile.changePhoto": { es: "Elegir otra foto", en: "Choose a different photo" },
  "profile.displayName": { es: "Nombre para mostrar", en: "Display name" },
  "profile.namePlaceholder": { es: "ej. María G.", en: "e.g. María G." },
  "profile.updatedTitle": { es: "Perfil actualizado", en: "Profile updated" },
  "profile.updatedBody": { es: "Tu círculo verá tu nuevo perfil.", en: "Your circle will see your new profile." },
  "profile.save": { es: "Guardar perfil", en: "Save profile" },
  "profile.errImage": { es: "Por favor elige un archivo de imagen.", en: "Please choose an image file." },
  "profile.errLoad": { es: "No se pudo cargar la imagen.", en: "Could not load image." },

  // ── pay dialog ──────────────────────────────────────────────────────────
  "pay.makePayment": { es: "Hacer un pago", en: "Make a payment" },
  "pay.opensWhenFull": {
    es: "Los pagos se habilitan cuando tu tanda se llena y empieza.",
    en: "Payments open once your tanda fills and starts.",
  },
  "pay.notStartedTitle": { es: "Aún no ha empezado", en: "Not started yet" },
  "pay.notStartedBody": {
    es: "Los pagos se habilitan cuando tu tanda se llena y empieza. Ya pagaste tu primer ciclo al unirte — no hay nada que pagar hasta que se active.",
    en: "Payments open once your tanda fills and starts. You've already paid your first cycle by joining — there's nothing to pay until it goes active.",
  },
  "pay.confirmedTitle": { es: "Pago confirmado", en: "Payment confirmed" },
  "pay.confirmedBodyOne": { es: "Pagaste 1 ciclo. Tu panel se actualizó.", en: "You paid 1 cycle. Your dashboard has been updated." },
  "pay.confirmedBody": { es: "Pagaste {n} ciclos. Tu panel se actualizó.", en: "You paid {n} cycles. Your dashboard has been updated." },
  "pay.makingTitle": { es: "Procesando el pago", en: "Making payment" },
  "pay.title": { es: "Hacer un pago", en: "Make a payment" },
  "pay.desc": {
    es: "Paga uno o más ciclos por adelantado. Has pagado hasta el ciclo {n} de {total}.",
    en: "Pay one or more cycles ahead. You've paid through cycle {n} of {total}.",
  },
  "pay.fullyPaid": { es: "Estás totalmente al día en esta tanda.", en: "You're fully paid up for this tanda." },
  "pay.upTo": { es: "hasta {n}", en: "up to {n}" },
  "pay.youPay": { es: "Pagas", en: "You pay" },
  "pay.cyclesToPay": { es: "Ciclos a pagar", en: "Cycles to pay" },
  "pay.payNCyclesOne": { es: "Pagar 1 ciclo", en: "Pay 1 cycle" },
  "pay.payNCycles": { es: "Pagar {n} ciclos", en: "Pay {n} cycles" },

  // ── create dialog ───────────────────────────────────────────────────────
  "create.btn": { es: "Crear tanda", en: "Create tanda" },
  "create.title": { es: "Crear una tanda", en: "Create a Tanda" },
  "create.desc": {
    es: "Un círculo de ahorro rotativo en {chain} — cada miembro recibe el bote una vez durante el ciclo.",
    en: "A rotating savings circle on {chain} — each member receives the pot once over the cycle.",
  },
  "create.contribution": { es: "Aportación por ciclo", en: "Contribution per cycle" },
  "create.inSym": { es: "En {sym}", en: "In {sym}" },
  "create.interval": { es: "Intervalo de pago", en: "Payout interval" },
  "create.daysRange": { es: "{min}–{max} días", en: "{min}–{max} days" },
  "create.days": { es: "días", en: "days" },
  "create.participants": { es: "Número de participantes", en: "Number of participants" },
  "create.grace": { es: "Periodo de gracia", en: "Grace period" },
  "create.graceHint": { es: "{min}–{max} días tras cada fecha límite", en: "{min}–{max} days after each deadline" },
  "create.start": { es: "Inicio", en: "Start" },
  "create.whenFull": { es: "Al llenarse", en: "When full" },
  "create.scheduled": { es: "Programado", en: "Scheduled" },
  "create.autoBody": { es: "Empieza automáticamente cuando se ocupa el último lugar.", en: "Starts automatically once the last seat is filled." },
  "create.privacy": { es: "Privacidad", en: "Privacy" },
  "create.public": { es: "Pública", en: "Public" },
  "create.privateOpt": { es: "Privada (por invitación)", en: "Private (invite-only)" },
  "create.inviteOnly": { es: "Por invitación", en: "Invite-only" },
  "create.anyoneJoin": { es: "Cualquiera puede unirse", en: "Anyone can join" },
  "create.privateHelp": {
    es: "Solo las wallets a las que firmes una invitación pueden unirse. Generarás enlaces de invitación después de crearla.",
    en: "Only wallets you sign an invite for can join. You'll generate invite links after creating.",
  },
  "create.token": { es: "Token", en: "Token" },
  "create.tokenHint": { es: "En la lista del Manager", en: "Allowlisted on the Manager" },
  "create.loadingTokens": { es: "Cargando tokens…", en: "Loading tokens…" },
  "create.noTokens": { es: "No se encontraron tokens permitidos en el Manager.", en: "No allowlisted tokens found on the Manager." },
  "create.summaryRuns": {
    es: "Dura {n} ciclos ({dur}). Cada miembro recibe el bote una vez.",
    en: "Runs for {n} cycles ({dur}). Each member receives the pot once.",
  },
  "create.summaryCharged": {
    es: "Se cobra ahora (tu primer ciclo): {total} {sym} — {contrib} + {prem} de seguro. Quedas inscrito como primer miembro.",
    en: "Charged now (your first cycle): {total} {sym} — {contrib} + {prem} insurance. You're enrolled as the first member.",
  },
  "create.summaryTotal": {
    es: "Durante toda la tanda pagarás {total} {sym} ({n} ciclos).",
    en: "Over the whole tanda you'll pay {total} {sym} ({n} cycles).",
  },
  "create.connect": { es: "Conecta tu wallet (arriba a la derecha) para crear una tanda.", en: "Connect your wallet (top right) to create a tanda." },
  "create.createBtn": { es: "Crear tanda", en: "Create Tanda" },
  "create.durMonths": { es: "~{n} meses", en: "~{n} months" },
  "create.durMonth": { es: "~1 mes", en: "~1 month" },
  "create.durWeeks": { es: "~{n} semanas", en: "~{n} weeks" },
  "create.durWeek": { es: "~1 semana", en: "~1 week" },
  "create.durDays": { es: "~{n} días", en: "~{n} days" },
  // create — pending panel
  "create.approveSign": { es: "Aprueba {sym} en tu wallet", en: "Approve {sym} in your wallet" },
  "create.approving": { es: "Aprobando {sym}…", en: "Approving {sym}…" },
  "create.signing": { es: "Confirma en tu wallet", en: "Confirm in your wallet" },
  "create.creating": { es: "Creando tu tanda…", en: "Creating your tanda…" },
  "create.approveSignBody": {
    es: "Crear una tanda cobra tu primera aportación + prima. Aprueba al Manager para gastar tus {sym}.",
    en: "Creating a tanda charges your first contribution + premium. Approve the Manager to spend your {sym}.",
  },
  "create.approvingBody": { es: "Esperando que se mine la aprobación en {chain}.", en: "Waiting for the approval to be mined on {chain}." },
  "create.signingBody": {
    es: "Confirma la transacción en tu wallet para crear la tanda y pagar tu primer ciclo.",
    en: "Confirm the transaction in your wallet to create the tanda and pay your first cycle.",
  },
  "create.creatingBody": {
    es: "Tu transacción está en el mempool. Esperando a que se mine en {chain}.",
    en: "Your transaction is in the mempool. Waiting for it to be mined on {chain}.",
  },
  // create — success panel
  "create.createdTitle": { es: "Tanda{n} creada", en: "Tanda{n} created" },
  "create.createdPublic": {
    es: "Tu tanda está activa y quedas inscrito como primer miembro (primer ciclo pagado). Comparte el enlace para llenar los lugares restantes.",
    en: "Your tanda is live and you're enrolled as the first member (first cycle paid). Share the link to fill the remaining seats.",
  },
  "create.createdPrivate": {
    es: "Tu tanda privada está activa y quedas inscrito como primer miembro. Genera enlaces de invitación para los demás lugares — solo las wallets invitadas pueden unirse.",
    en: "Your private tanda is live and you're enrolled as the first member. Generate invite links for the remaining seats — only invited wallets can join.",
  },
  "create.sharePublic": { es: "Comparte este enlace para que la gente se una", en: "Share this link to let people join" },
  "create.sharePrivate": { es: "Comparte este enlace para que la gente pida unirse", en: "Share this link to let people request to join" },
  "create.advancedInvite": { es: "Avanzado: invitar una wallet específica directamente", en: "Advanced: invite a specific wallet directly" },
  "create.goToDashboard": { es: "Ir al panel", en: "Go to dashboard" },

  // ── join dialog ─────────────────────────────────────────────────────────
  "join.btn": { es: "Unirme a una tanda", en: "Join a tanda" },
  "join.title": { es: "Unirse a una tanda", en: "Join a Tanda" },
  "join.descPreset": { es: "Únete para reclamar tu lugar y activar esta tanda.", en: "Join to claim your seat and activate this tanda." },
  "join.descEnter": { es: "Ingresa un ID de tanda para ver sus términos y unirte.", en: "Enter a tanda ID to see its terms and join." },
  "join.idLabel": { es: "ID de tanda", en: "Tanda ID" },
  "join.lookingUp": { es: "Buscando…", en: "Looking up…" },
  "join.noTanda": { es: "No hay tanda con ese ID.", en: "No tanda with that ID." },
  "join.loadingTerms": { es: "Cargando términos de la tanda…", en: "Loading tanda terms…" },
  "join.terms": { es: "Términos de la tanda{n}", en: "Tanda{n} terms" },
  "join.contribution": { es: "Aportación", en: "Contribution" },
  "join.interval": { es: "Intervalo de pago", en: "Payout interval" },
  "join.participants": { es: "Participantes", en: "Participants" },
  "join.slotsLeft": { es: "Lugares libres", en: "Slots left" },
  "join.slotsOf": { es: "{n} de {m}", en: "{n} of {m}" },
  "join.already": { es: "Ya eres participante de esta tanda.", en: "You're already a participant in this tanda." },
  "join.privateBlock": {
    es: "Esta es una tanda privada (por invitación) — necesitas una invitación para unirte.",
    en: "This is a private (invite-only) tanda — you need an invite to join.",
  },
  "join.notOpen": { es: "Esta tanda ya no admite nuevos miembros.", en: "This tanda is no longer open to new members." },
  "join.full": { es: "Esta tanda está llena.", en: "This tanda is full." },
  "join.payNow": { es: "Pagas ahora (ciclo 1)", en: "You pay now (cycle 1)" },
  "join.joinPay": { es: "Unirme y pagar ciclo 1", en: "Join & pay cycle 1" },
  "join.joiningTitle": { es: "Uniéndote a la tanda", en: "Joining tanda" },
  "join.joiningDesc": { es: "Mantén esto abierto hasta que ambos pasos confirmen.", en: "Keep this open until both steps confirm." },
  "join.joinPayAction": { es: "Unirme a la tanda (pagar ciclo 1)", en: "Join tanda (pay cycle 1)" },
  "join.successTitle": { es: "¡Ya estás dentro!", en: "You're in!" },
  "join.successBody": {
    es: "Te uniste a la tanda y pagaste tu primer ciclo. Ahora aparece en tu panel.",
    en: "You've joined the tanda and paid your first cycle. It now appears on your dashboard.",
  },
  "join.connect": { es: "Conecta tu wallet (arriba a la derecha) para unirte.", en: "Connect your wallet (top right) to join." },

  // ── tx guard / cost ─────────────────────────────────────────────────────
  "guard.needBalance": { es: "Necesitas {req} {sym} (tienes {bal}).", en: "You need {req} {sym} (you have {bal})." },
  "guard.approveAnd": { es: "Aprobar y {action}", en: "Approve & {action}" },

  // ── landing / promo page ────────────────────────────────────────────────
  "land.openApp": { es: "Abrir app", en: "Open app" },
  "land.navHow": { es: "Cómo funciona", en: "How it works" },
  "land.navSafe": { es: "Por qué es seguro", en: "Why it's safe" },
  "land.navWho": { es: "Para quién es", en: "Who it's for" },

  // hero
  "land.heroTitle1": { es: "El círculo de ahorro de toda la vida,", en: "The savings circle you grew up with," },
  "land.heroTitle2": { es: "nuevo y mejorado.", en: "new and Improved." },
  "land.heroSubhead": {
    es: "Ahorra junto a personas en quienes confías. Cada ronda todos aportan, y cada ronda una persona se lleva el bote completo — guardado y pagado de forma segura, automáticamente.",
    en: "Save together with people you trust. Everyone chips in each round, and each round one person takes home the whole pot — held and paid out safely, automatically.",
  },
  "land.ctaStart": { es: "Inicia una tanda", en: "Start a tanda" },
  "land.ctaJoin": { es: "Únete a un círculo", en: "Join a circle" },
  "land.trustMade": { es: "Círculos de ahorro rotativos, hechos seguros", en: "Rotating savings circles, made safe" },
  "land.trustNoOrg": { es: "Nadie guarda el dinero", en: "No organizer holds the money" },
  "land.trustDeposit": { es: "Depósito reembolsable", en: "Refundable deposit" },
  "land.trustVerifiable": { es: "Verificable públicamente", en: "Publicly verifiable" },

  // what's a tanda
  "land.watEyebrow": { es: "Una tradición, honrada", en: "A tradition, honored" },
  "land.watTitle": { es: "¿Qué es una tanda?", en: "What's a tanda?" },
  "land.watSubtitle": {
    es: "Una tanda es un círculo de ahorro rotativo en el que familias y comunidades han confiado por generaciones. La idea es simple: ahorrar juntos, tomar turnos y ayudarse a alcanzar una meta más pronto.",
    en: "A tanda is a rotating savings circle that families and communities have trusted for generations. The idea is simple: save together, take turns, and help each other reach a goal sooner.",
  },
  "land.watP1t": { es: "Todos aportan", en: "Everyone chips in" },
  "land.watP1b": { es: "Un grupo acuerda un monto fijo y lo aporta cada ronda.", en: "A group agrees on a fixed amount and contributes it every round." },
  "land.watP2t": { es: "Una persona se lleva el bote", en: "One person takes the pot" },
  "land.watP2b": { es: "Cada ronda, el bote completo va para un solo miembro del círculo.", en: "Each round, the full pot goes to a single member of the circle." },
  "land.watP3t": { es: "Rota hasta que todos cobran", en: "It rotates until all are paid" },
  "land.watP3b": { es: "El turno avanza hasta que cada quien ha recibido una vez — y entonces termina.", en: "The turn passes along until everyone has received once — then it ends." },

  // how it works
  "land.howTitle": { es: "Cuatro pasos simples, de inicio a fin", en: "Four simple steps, start to finish" },
  "land.howSubtitle": {
    es: "El mismo ritmo de la tanda que ya conoces — con mucha más comodidad y seguridad.",
    en: "The same rhythm as the tanda you already know — with much more convenience and security.",
  },
  "land.howS1t": { es: "Crea o únete a una tanda", en: "Create or join a tanda" },
  "land.howS1b": {
    es: "Inicia tu propio círculo o únete a uno. Hazlo público o mantenlo privado con un enlace de invitación para amigos y familia.",
    en: "Start your own circle or join one. Make it public, or keep it private with an invite link for friends and family.",
  },
  "land.howS2t": { es: "Todos aportan USDC", en: "Everyone contributes USDC" },
  "land.howS2b": {
    es: "Cada ciclo, cada miembro aporta el mismo monto fijo. El contrato inteligente lo recauda y lo guarda — ningún organizador toca el dinero.",
    en: "Each cycle, every member puts in the same fixed amount. The smart contract collects and holds it — no organizer touches the money.",
  },
  "land.howS3t": { es: "Un miembro recibe el bote completo", en: "One member gets the full pot" },
  "land.howS3b": {
    es: "Cada ciclo, el bote entero va para una persona del círculo. Puede ser para la renta, una meta o un imprevisto.",
    en: "Each cycle, the entire pot goes to one person in the circle. It could be for rent, a goal, or a rainy day.",
  },
  "land.howS4t": { es: "Rota hasta que todos cobran", en: "Rotate until everyone is paid" },
  "land.howS4b": {
    es: "El pago pasa de miembro en miembro cada ciclo. Cuando todos han tenido su turno, la tanda se completa.",
    en: "The payout passes from member to member each cycle. Once everyone has had a turn, the tanda completes.",
  },

  // why it's safe
  "land.safeTitle": { es: "Diseñado para que los miembros honestos siempre estén protegidos", en: "Built so honest members are always protected" },
  "land.safeSubtitle": {
    es: "La confianza de una tanda, con protecciones que no dependen de que alguien cumpla su palabra.",
    en: "The trust of a tanda, with guardrails that don't depend on anyone keeping their word.",
  },
  "land.safeC1t": { es: "Lo guarda el código, no una persona", en: "Held by code, not a person" },
  "land.safeC1b": {
    es: "El dinero se guarda y se libera automáticamente por código — así ningún organizador puede llevarse los fondos.",
    en: "The money is held and released automatically by code — so no organizer can ever run off with the funds.",
  },
  "land.safeC2t": { es: "Protegido contra incumplimientos", en: "Protected against no-shows" },
  "land.safeC2b": {
    es: "Un pequeño depósito reembolsable cubre al círculo si alguien deja de pagar, así los miembros honestos siempre quedan completos.",
    en: "A small refundable deposit covers the circle if someone stops paying, so honest members always stay whole.",
  },
  "land.safeC3t": { es: "Totalmente transparente", en: "Fully transparent" },
  "land.safeC3b": {
    es: "Cada aportación y cada pago es verificable públicamente — cualquiera de tu círculo puede revisarlo, cuando quiera.",
    en: "Every contribution and every payout is publicly verifiable — anyone in your circle can check, anytime.",
  },

  // the trust problem, solved
  "land.tsEyebrow": { es: "Confianza sin el riesgo", en: "Trust without the risk" },
  "land.tsTitle": { es: "El problema de confianza, por fin resuelto", en: "The trust problem, finally solved" },
  "land.tsSubtitle": {
    es: "Las tandas siempre han funcionado con confianza — y a veces esa confianza se rompe. Mi Tanda conserva todo lo que amas de la tradición y elimina el único riesgo real.",
    en: "Tandas have always run on trust — and sometimes that trust gets broken. Mi Tanda keeps everything you love about the tradition and removes the one real risk.",
  },
  "land.tsFearLabel": { es: "El miedo", en: "The fear" },
  "land.tsFearQuote": {
    es: "«¿Y si el organizador desaparece con el dinero?»",
    en: "“What if the organizer disappears with the money?”",
  },
  "land.tsFearBody": {
    es: "Con Mi Tanda, no pueden. No hay un organizador que guarde los fondos — lo hace el contrato inteligente, y solo puede seguir las reglas que todos acordaron. Hacer trampa es simplemente imposible.",
    en: "With Mi Tanda, they can't. There's no organizer holding the funds — the smart contract does, and it can only follow the rules everyone agreed to. It's simply impossible to cheat.",
  },
  "land.tsC1t": { es: "Nadie puede huir con el bote", en: "No one can run off with the pot" },
  "land.tsC1b": {
    es: "El contrato inteligente guarda y mueve el dinero con reglas fijas. No hay una wallet de organizador que vaciar — el código, no una persona, controla el pago.",
    en: "The smart contract holds and moves the money by fixed rules. There is no organizer wallet to drain — the code, not a person, controls the payout.",
  },
  "land.tsC2t": { es: "Transparente y verificable", en: "Transparent and verifiable" },
  "land.tsC2b": {
    es: "Cada aportación y cada pago queda registrado on-chain. Cualquiera en el círculo puede comprobar que se siguen las reglas.",
    en: "Every contribution and payout is recorded on-chain. Anyone in the circle can check that the rules are being followed.",
  },
  "land.tsC3t": { es: "Tú mantienes el control de tus fondos", en: "You keep control of your funds" },
  "land.tsC3b": {
    es: "Tu dinero se queda bajo las reglas del contrato, no en la cuenta bancaria ni el bolsillo de alguien más.",
    en: "Your money stays in the rules of the contract, not in someone else's bank account or pocket.",
  },
  "land.tsC4t": { es: "Construido en Base, en USDC", en: "Built on Base, in USDC" },
  "land.tsC4b": {
    es: "Funciona en Base, la red de Ethereum de bajo costo de Coinbase, usando USDC — una stablecoin anclada al dólar — para que los montos se mantengan estables.",
    en: "Runs on Base, Coinbase's low-cost Ethereum network, using USDC — a dollar-pegged stablecoin — so amounts stay steady.",
  },
  // built-in insurance
  "land.insEyebrow": { es: "Seguro integrado", en: "Built-in insurance" },
  "land.insTitle": { es: "Un regalo esperando en la meta", en: "A gift waiting at the finish line" },
  "land.insBody": {
    es: "Cada pago incluye una pequeña aportación de seguro del 10% adicional. Piénsalo como un fondo de ahorro dentro de tu fondo de ahorro — y cuando la tanda se completa, cada miembro recibe de vuelta todas sus aportaciones de seguro. Es una pequeña recompensa por terminar lo que empezaste, y una razón para seguir.",
    en: "Every payment includes a small 10% insurance contribution on top. Think of it as a savings pot inside your savings pot — and when the tanda completes, every member gets all of their insurance payments back. It's a little reward for finishing what you started, and a reason to keep going.",
  },
  "land.insFinishT": { es: "Termina fuerte y recupéralo todo", en: "Finish strong, get it all back" },
  "land.insFinishB": {
    es: "Completa la tanda y tu saldo de seguro completo se te devuelve — motivación para quedarte hasta la última ronda.",
    en: "Complete the tanda and your full insurance balance is returned to you — motivation to stay in until the very last round.",
  },
  "land.insDefaultT": { es: "Si abandonas, lo pierdes", en: "Default and you forfeit it" },
  "land.insDefaultB": {
    es: "Si un miembro deja de pagar, pierde todo lo que aportó — sus contribuciones y su seguro — así que quienes se quedan están protegidos.",
    en: "If a member stops paying, they lose everything they've put in — their contributions and their insurance — so the people who stay are protected.",
  },

  // built for real money
  "land.moneyEyebrow": { es: "Hecho para dinero real", en: "Built for real money" },
  "land.moneyTitle": { es: "Dinero real, entra y sale — al instante", en: "Real money, in and out — instantly" },
  "land.moneySubtitle": {
    es: "Ahorra en la moneda que ya usas, y recibe tu bote en el momento en que es tu turno.",
    en: "Save in the currency you already use, and get your pot the moment it's your turn.",
  },
  "land.moneyPesosTitle": { es: "Pesos digitales", en: "Digital pesos" },
  "land.moneyPesosBody": {
    es: "Ahorra en pesos con MXNB — el mismo valor que el efectivo que ya usas, listo para enviar y recibir.",
    en: "Save in pesos with MXNB — the same value as the cash you already use, ready to send and receive.",
  },
  "land.moneyDollarsTitle": { es: "Dólares digitales", en: "Digital dollars" },
  "land.moneyDollarsBody": {
    es: "¿Prefieres dólares? Lleva tu círculo en USDC. Tu círculo, tu moneda — tú eliges.",
    en: "Prefer dollars? Run your circle in USDC instead. Your circle, your currency — you choose.",
  },
  "land.moneyInstantTitle": { es: "Pagos instantáneos", en: "Instant payouts" },
  "land.moneyInstantBody": {
    es: "Cuando es tu turno, el bote completo llega de inmediato — sin esperas y sin perseguir a nadie.",
    en: "When it's your turn, the full pot arrives right away — no waiting and no chasing anyone down.",
  },
  "land.moneyFeesTitle": { es: "Comisiones pequeñas y claras", en: "Small, clear fees" },
  "land.moneyFeesBody": {
    es: "Solo comisiones pequeñas y transparentes — mostradas por adelantado, sin nada oculto ni sorpresas.",
    en: "Only small, transparent fees — shown to you up front, with nothing hidden and no surprises.",
  },

  // who it's for
  "land.whoTitle": { es: "Hecho para círculos de personas que confían entre sí", en: "Made for circles of people who trust each other" },
  "land.whoBody": {
    es: "Si alguna vez has estado en una tanda o cundina, ya sabes cómo funciona. Si no, es la forma más fácil de ahorrar con personas en quienes confías.",
    en: "If you've ever been in a tanda or cundina, you already know how this works. If you haven't, it's the easiest way to save with people you trust.",
  },
  "land.whoChip1": { es: "Familia y amigos", en: "Family and friends" },
  "land.whoChip2": { es: "Compañeros y vecinos", en: "Coworkers and neighbors" },
  "land.whoChip3": { es: "Primerizos, bienvenidos", en: "First-timers welcome" },

  // final CTA
  "land.finalTitle": { es: "Comienza tu primera tanda hoy", en: "Start your first tanda today" },
  "land.finalBody": {
    es: "Reúne a tu círculo, define el monto y deja que todos ahorren juntos — de forma segura.",
    en: "Gather your circle, set your amount, and let everyone save together — safely.",
  },

  // footer
  "land.footFaq": { es: "Preguntas", en: "FAQ" },
  "land.footContact": { es: "Contacto", en: "Contact" },
  "land.footTagline": {
    es: "La forma de siempre de ahorrar juntos — ahora resguardada por código.",
    en: "The familiar way to save together — now held safely by code.",
  },
  "land.footCopyright": { es: "© {year} MiTanda. Ahorra junto, con seguridad.", en: "© {year} MiTanda. Save together, safely." },
  "land.footPowered": { es: "Impulsado por Arbitrum y Base, con MXNB de Bitso", en: "Powered by Arbitrum & Base, with Bitso's MXNB" },

  // hero illustration labels
  "land.vizThisRound": { es: "esta ronda", en: "this round" },
  "land.vizRound": { es: "Ronda {x} de {n}", en: "Round {x} of {n}" },
  "land.vizTurn": { es: "turno de {name}", en: "{name}'s turn" },
} as const;

export type TKey = keyof typeof dict;
