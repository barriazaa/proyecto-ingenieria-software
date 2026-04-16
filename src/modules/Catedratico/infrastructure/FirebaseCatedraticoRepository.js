import { db } from "../../../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const PRIMARY_USERS_COLLECTION = "users";
const LEGACY_USERS_COLLECTION = "usuarios";
const PRIMARY_COURSES_COLLECTION = "courses";
const LEGACY_COURSES_COLLECTION = "cursos";

const readCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }));
};

const getAllUsers = async () => {
  const users = await readCollection(PRIMARY_USERS_COLLECTION);

  if (users.length > 0) {
    return users;
  }

  return readCollection(LEGACY_USERS_COLLECTION);
};

const getAllCourses = async () => {
  const courses = await readCollection(PRIMARY_COURSES_COLLECTION);

  if (courses.length > 0) {
    return courses;
  }

  return readCollection(LEGACY_COURSES_COLLECTION);
};

class FirebaseCatedraticoRepository {
  async getReporteria() {
    const [users, courses] = await Promise.all([getAllUsers(), getAllCourses()]);
    const estudiantes = users.filter((user) => user.rol === "estudiante");
    const cursosActivos = courses.filter((course) => course.estado);

    return {
      totalEstudiantes: estudiantes.length,
      totalCursos: courses.length,
      cursosActivos: cursosActivos.length,
    };
  }

  async getEstudiantes() {
    const usersQuery = query(
      collection(db, PRIMARY_USERS_COLLECTION),
      where("rol", "==", "estudiante")
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      return usersSnapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...documentSnapshot.data(),
      }));
    }

    const legacyUsers = await getAllUsers();
    return legacyUsers.filter((user) => user.rol === "estudiante");
  }
}

export default new FirebaseCatedraticoRepository();
