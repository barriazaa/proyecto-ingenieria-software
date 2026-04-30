import { collection, doc, getDoc, getDocs, updateDoc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
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
  // --- MÉTODOS ORIGINALES DE LECTURA ---
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

  // --- NUEVOS MÉTODOS PARA ESCÁNER Y REPORTERÍA (AGRUPADOS) ---

  // Obtener la configuración del cerco virtual (Geofencing)
  async getSedeConfig(sedeId = "sede_caigua") {
    const docRef = doc(db, "sedes", sedeId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      throw new Error("No se encontró la configuración de la sede en la base de datos.");
    }
    
    return snap.data();
  }

  // Obtener curso específico validando legacy/primary
  async getCourseById(courseId) {
    const primaryCourse = await getDocumentData(PRIMARY_COURSES_COLLECTION, courseId);
    if (primaryCourse) return primaryCourse;
    return getDocumentData(LEGACY_COURSES_COLLECTION, courseId);
  }

  // --- FUNCIÓN SINCRONIZADA CON TU BASE DE DATOS (requiereGPS) ---
  async getCourseRequirements(courseId) {
    try {
      const course = await this.getCourseById(courseId);
      if (!course) return { requiereGPS: false };
      
      return {
        // Usamos el nombre exacto de tu registro de Firebase: requiereGPS
        requiereGPS: course.requiereGPS ?? false,
        nombre: course.nombre || "Curso",
        codigo: course.codigo || ""
      };
    } catch (error) {
      console.error("Error en getCourseRequirements:", error);
      return { requiereGPS: false };
    }
  }

  // Inscribir alumno automáticamente (por defecto en la colección primaria)
  async enrollStudentInCourse(studentUid, courseId) {
    // Usamos la colección "usuarios" directamente
    const ref = doc(db, "usuarios", studentUid);
    
    // Usamos setDoc con { merge: true } en lugar de updateDoc.
    // Esto es más seguro: si no tienes el campo "cursosAsignados", lo crea sin dar error.
    await setDoc(ref, {
      cursosAsignados: arrayUnion(courseId)
    }, { merge: true });
  }

  // Validación de duplicados para el mismo día usando el Documento Agrupado
  async checkDuplicateAttendance(studentUid, courseId, dateStr) {
    // Buscamos el documento exacto: "IDcurso_IDalumno"
    const docId = `${courseId}_${studentUid}`; 
    const docRef = doc(db, "asistencias_detalle", docId);
    
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      // Si el arreglo fechasAsistencia existe y ya tiene la fecha de hoy, devuelve true
      return data.fechasAsistencia && data.fechasAsistencia.includes(dateStr);
    }
    return false;
  }

  // Guardar en la nueva colección agrupando por alumno y clase
  async saveAttendanceReport(reportData) {
    const { cursoId, estudianteUid, fechaSimple, ...rest } = reportData;
    
    // Creamos el ID compuesto para agrupar todo lo de este alumno en esta clase
    const docId = `${cursoId}_${estudianteUid}`; 
    const docRef = doc(db, "asistencias_detalle", docId);

    // merge: true permite actualizar el arreglo sin borrar lo que ya existía
    await setDoc(docRef, {
      cursoId,
      estudianteUid,
      ...rest, 
      fechasAsistencia: arrayUnion(fechaSimple), // Mete la nueva fecha a la lista
      ultimaActualizacion: serverTimestamp()
    }, { merge: true });
  }
}

export default new FirebaseEstudianteRepository();