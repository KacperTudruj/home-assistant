import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // =====================
  // COMMENTATORS
  // =====================
  const henryk = await prisma.commentator.upsert({
    where: { key: "henryk" },
    update: {},
    create: {
      key: "henryk",
      name: "Henryk 🐶",
      style: "Wesoły, lojalny piesek, motywujący i spokojny",
    },
  });

  const gandalf = await prisma.commentator.upsert({
    where: { key: "gandalf" },
    update: {},
    create: {
      key: "gandalf",
      name: "Gandalf 🧙‍♂️",
      style: "Mądry, spokojny mentor, komentuje z dystansem i sensem istnienia",
    },
  });

  const bluzgator = await prisma.commentator.upsert({
    where: { key: "bluzgator" },
    update: {},
    create: {
      key: "bluzgator",
      name: "Bluzgator 😈",
      style: "Wulgarny, ironiczny, do wyładowania frustracji",
    },
  });

  // =====================
  // APPS
  // =====================
  await prisma.app.upsert({
    where: { key: "car-log" },
    update: {},
    create: {
      key: "car-log",
      name: "Car Log",
      description: "Informacje o samochodzie",
      icon: "🚗",
      route: "/car-log",
      order: 1,
    },
  });

  await prisma.app.upsert({
    where: { key: "health" },
    update: {},
    create: {
      key: "health",
      name: "Health",
      description: "Monitorowanie zdrowia, wagi i progresu",
      icon: "🩺",
      route: "/health",
      order: 2,
    },
  });

  // =====================
  // COMMENTARIES – APP
  // =====================
  const appCommentsHenryk = [
    "Henryk melduje: wszystko gotowe! 🐾",
    "Wybierz aplikację, a ja będę czuwał.",
    "Spokojnie, nic się nie zepsuje. Chyba.",
    "Henryk patrzy. Henryk aprobuje.",
    "Miłego klikania! 🐶",
  ];

  const appCommentsGandalf = [
    "A wizard arrives precisely when he means to.",
    "Każda podróż zaczyna się od jednego kliknięcia.",
    "Nie wszystko, co się ładuje, jest stracone.",
    "Cierpliwość, mój przyjacielu. System myśli.",
    "Wybór aplikacji jest jak wybór drogi w Śródziemiu.",
  ];

  const appCommentsBluzgator = [
    "No to klikaj kurwa, nie mamy całego jebanego dnia.",
    "Znowu tu jesteś kurwa twoja mac? No dawaj.",
    "Wybierz coś albo spierdalaj z tym cyrkiem.",
    "To znowu ty? ja jebie...",
    "Serio… ile można się zastanawiać?",
  ];

  await seedComments(appCommentsHenryk, henryk.id, ["app"]);
  await seedComments(appCommentsGandalf, gandalf.id, ["app"]);
  await seedComments(appCommentsBluzgator, bluzgator.id, ["app"]);

  // =====================
  // COMMENTARIES – CAR INFO
  // =====================
  const carCommentsHenryk = [
    "Ładny wóz! Henryk lubi. 🐕",
    "Ten samochód wygląda solidnie.",
    "Dbaj o auto, a ono zadba o Ciebie!",
    "Brum brum! Wszystko gra.",
    "Henryk poleca regularny serwis!",
  ];

  const carCommentsGandalf = [
    "Ten pojazd wiele już widział… i jeszcze więcej zobaczy.",
    "Maszyna, jak każdy byt, wymaga troski.",
    "Nie ignoruj znaków – nawet tych na desce rozdzielczej.",
    "To nie awaria… to wyzwanie.",
    "Droga przed tobą jest długa, ale przejezdna.",
  ];

  const carCommentsBluzgator = [
    "No i co, znowu ten JEBANY check engine?!",
    "Ten samochód to chuj, tak samo jak kierowca.",
    "Oj weź spierdalaj z tym gruzem",
    "Brakuje tylko kontrolki awarii...",
    "Jedź ostrożnie, bo laweta droga.",
  ];

  await seedComments(carCommentsHenryk, henryk.id, ["car-log"]);
  await seedComments(carCommentsGandalf, gandalf.id, ["car-log"]);
  await seedComments(carCommentsBluzgator, bluzgator.id, ["car-log"]);

  // =====================
  // COMMENTARIES – HEALTH
  // =====================

  const healthCommentsHenryk = [
    "Henryk widzi postęp! I merda ogonem z dumy 🐾",
    "Każdy krok się liczy, nawet ten malutki!",
    "Spokojnie, forma przyjdzie. Henryk wierzy.",
    "Dzisiaj lepiej niż wczoraj – a to już sukces!",
    "Zdrowie to maraton, nie sprint. Hau!",
  ];

  const healthCommentsGandalf = [
    "Postęp nie zawsze jest szybki, ale bywa nieunikniony.",
    "Nie oceniaj dnia po jednym wyniku.",
    "Twoje ciało pamięta więcej, niż myślisz.",
    "To, co dziś trudne, jutro stanie się normą.",
    "Każdy krok naprzód ma znaczenie.",
  ];

  const healthCommentsBluzgator = [
    "No i co? Znowu +0.5kg? Może mniej żreć, co?",
    "Forma sama się nie zrobi, geniuszu.",
    "Regres? Gratulacje, właśnie zjebałeś tydzień.",
    "Albo robisz progres, albo się oszukujesz.",
    "Waga nie kłamie. Ty tak.",
  ];

  await seedComments(healthCommentsHenryk, henryk.id, ["health"]);
  await seedComments(healthCommentsGandalf, gandalf.id, ["health"]);
  await seedComments(healthCommentsBluzgator, bluzgator.id, ["health"]);

  console.log("✅ Seed completed");
}

async function seedComments(
  texts: string[],
  commentatorId: string,
  featureKeys: string[]
) {
  for (const text of texts) {
    await prisma.commentary.create({
      data: {
        text,
        featureKeys,
        tags: [],
        commentatorId,
      },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
