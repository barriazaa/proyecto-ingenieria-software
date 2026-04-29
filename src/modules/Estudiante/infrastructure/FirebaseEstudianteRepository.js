import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import FirebaseAttendanceReportRepository from "../reportes/infrastructure/FirebaseAttendanceReportRepository";

const PRIMARY_USERS_COLLECTION = "users";
const LEGACY_USERS_COLLECTION = "usuarios";
const PRIMARY_COURSES_COLLECTION = "courses";
const LEGACY_COURSES_COLLECTION = "cursos";

const readCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    _collection: collectionName,
    ...documentSnapshot.data(),
  }));
};

const getDocumentData = async (collectionName, id) => {
  const snapshot = await getDoc(doc(db, collectionName, id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    _collection: collectionName,
    ...snapshot.data(),
  };
};

const getStudentFromCollections = async (uid) => {
  const primaryStudent = await getDocumentData(PRIMARY_USERS_COLLECTION, uid);

  if (primaryStudent) {
    return primaryStudent;
  }

  return getDocumentData(LEGACY_USERS_COLLECTION, uid);
};

const getCoursesFromCollections = async () => {
  const primaryCourses = await readCollection(PRIMARY_COURSES_COLLECTION);

  if (primaryCourses.length > 0) {
    return primaryCourses;
  }

  return readCollection(LEGACY_COURSES_COLLECTION);
};

class FirebaseEstudianteRepository {
  async getStudentProfile(uid) {
    return getStudentFromCollections(uid);
  }

  async getAssignedCourses(courseIds) {
    const courses = await getCoursesFromCollections();

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return [];
    }

    return courses.filter((course) => courseIds.includes(course.id));
  }

  async getStudentAttendances(student) {
    return FirebaseAttendanceReportRepository.getStudentAttendances(student);
  }
}

export default new FirebaseEstudianteRepository();
