import Dexie from "dexie";
import "dexie-observable";

const db = new Dexie("workflow");

const subscribers = {
  records: [],
};

const publish = (topic, data) => {
  subscribers[topic].forEach((subscriber) => {
    subscriber(data);
  });
};

const subscribe = async (topic, subscriber) => {
  subscribers[topic].push(subscriber);

  publish(
    "records",
    await db.records
      .where("date")
      .above(0)
      .sortBy("date"),
  );
};

db.version(1).stores({
  records: "date,videoName,workDir",
});

db.on("changes", (changes) => {
  changes.forEach(async (change) => {
    switch (change.type) {
      case 1: // CREATED
      case 2: // UPDATED
      case 3: // DELETED
        publish(
          "records",
          await db.records
            .where("date")
            .above(0)
            .sortBy("date"),
        );

        break;
    }
  });
});

db.open();

export { db, subscribe };
