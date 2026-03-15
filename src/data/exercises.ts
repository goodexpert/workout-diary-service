import db from "@/db";

export async function getAllExercises() {
  return db.query.exercises.findMany({
    orderBy: (e, { asc }) => [asc(e.name)],
  });
}
