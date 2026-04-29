import { db } from "../../../firebase/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";

const PRIMARY_USERS_COLLECTION = "users";
const LEGACY_USERS_COLLECTION = "usuarios";
const PRIMARY_COURSES_COLLECTION = "courses";
const LEGACY_COURSES_COLLECTION = "cursos";

const normalizeText = (value = "") =>
  String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isStudentRole = (role) => {
  const normalizedRole = normalizeText(role);
  return normalizedRole === "estudiante" || normalizedRole === "alumno";
};

const readCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    _collection: collectionName,
    ...documentSnapshot.data(),
  }));
};

const getAllUsers = async () => {
  const [primaryUsers, legacyUsers] = await Promise.all([
    readCollection(PRIMARY_USERS_COLLECTION),
    readCollection(LEGACY_USERS_COLLECTION),
  ]);
  const usersById = new Map();

  [...primaryUsers, ...legacyUsers].forEach((user) => {
    const userId = user.uid || user.id;

    if (userId) {
      usersById.set(userId, user);
      return;
    }

    usersById.set(`${user._collection}-${usersById.size}`, user);
  });

  return Array.from(usersById.values());
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
    const estudiantes = users.filter((user) => isStudentRole(user.rol));
    const cursosActivos = courses.filter((course) => course.estado);

    return {
      totalEstudiantes: estudiantes.length,
      totalCursos: courses.length,
      cursosActivos: cursosActivos.length,
    };
  }

  async getEstudiantes() {
    const users = await getAllUsers();
    return users.filter((user) => isStudentRole(user.rol));
  }

  async updateStudent(student) {
    const targetCollection = student._collection || LEGACY_USERS_COLLECTION;
    const { id, uid, _collection, nombre, correo, cursosAsignados, ...studentData } = student;
    const targetId = uid || id;

    const [nombres = "", ...apellidosParts] = (nombre || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const apellidos = apellidosParts.join(" ");

    const payload = {
      ...studentData,
      uid: targetId,
      carnet: student.carnet || "",
      estado: student.estado || "Activo",
      nombres,
      apellidos,
      email: correo || student.email || "",
      cursosAsignados: Array.isArray(cursosAsignados) ? cursosAsignados : [],
    };

    await updateDoc(doc(db, targetCollection, targetId), payload);

    return {
      id: targetId,
      _collection: targetCollection,
      ...payload,
    };
  }
}

export default new FirebaseCatedraticoRepository();
