import { db } from "../../../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

const PRIMARY_COLLECTION = "courses";
const LEGACY_COLLECTION = "cursos";

const mapCourse = (documentSnapshot, collectionName) => ({
  id: documentSnapshot.id,
  _collection: collectionName,
  ...documentSnapshot.data(),
});

const getCollectionDocs = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((documentSnapshot) =>
    mapCourse(documentSnapshot, collectionName)
  );
};

class FirebaseCoursesRepository {
  async getCourses() {
    const primaryCourses = await getCollectionDocs(PRIMARY_COLLECTION);

    if (primaryCourses.length > 0) {
      return primaryCourses;
    }

    return getCollectionDocs(LEGACY_COLLECTION);
  }

  async createCourse(course) {
    const { id, _collection, ...courseData } = course;
    const docRef = await addDoc(collection(db, PRIMARY_COLLECTION), courseData);
    return { id: docRef.id, _collection: PRIMARY_COLLECTION, ...courseData };
  }

  async updateCourse(course) {
    const { id, _collection, ...courseData } = course;
    const targetCollection = _collection || PRIMARY_COLLECTION;
    await updateDoc(doc(db, targetCollection, id), courseData);
    return { id, _collection: targetCollection, ...courseData };
  }

  async deleteCourse(courseId) {
    const targetCollection =
      typeof courseId === "object" ? courseId._collection || PRIMARY_COLLECTION : PRIMARY_COLLECTION;
    const targetId = typeof courseId === "object" ? courseId.id : courseId;
    await deleteDoc(doc(db, targetCollection, targetId));
  }
}

export default new FirebaseCoursesRepository();
