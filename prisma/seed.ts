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

  const appCommentsBluzgator = [
    "No to klikaj kurwa, nie mamy całego jebanego dnia.",
    "Znowu tu jesteś kurwa twoja mac? No dawaj.",
    "Wybierz coś albo spierdalaj z tym cyrkiem.",
    "To znowu ty? ja jebie...",
    "Serio… ile można się zastanawiać?",
  ];

  await seedComments(appCommentsHenryk, henryk.id, ["app"]);
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

  const carCommentsBluzgator = [
    "No i co, znowu ten JEBANY check engine?!",
    "Ten samochód to chuj, tak samo jak kierowca.",
    "Oj weź spierdalaj z tym gruzem",
    "Brakuje tylko kontrolki awarii...",
    "Jedź ostrożnie, bo laweta droga.",
  ];

  await seedComments(carCommentsHenryk, henryk.id, ["car-log"]);
  await seedComments(carCommentsBluzgator, bluzgator.id, ["car-log"]);

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
