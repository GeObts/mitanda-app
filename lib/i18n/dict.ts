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
} as const;

export type TKey = keyof typeof dict;
