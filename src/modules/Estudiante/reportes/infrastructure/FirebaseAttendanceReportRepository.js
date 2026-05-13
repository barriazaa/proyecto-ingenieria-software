import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../../firebase/firebase";

const PRIMARY_ATTENDANCES_COLLECTION = "attendances";
const LEGACY_ATTENDANCES_COLLECTION = "asistencias";
const GROUPED_ATTENDANCES_COLLECTION = "asistencias_detalle"; // La nueva colección agrupada

class FirebaseAttendanceReportRepository {
  /**
   * Obtiene las asistencias del estudiante de forma eficiente.
   * Prioriza la nueva colección 'asistencias_detalle'.
   */
  async getStudentAttendances(student) {
    const studentUid = student?.uid || student?.id;
    
    if (!studentUid) {
      console.warn("No se encontró UID del estudiante para cargar reportes.");
      return [];
    }

    try {
      // 1. Intentamos leer de la nueva colección agrupada (Búsqueda ultra rápida)
      const groupedQuery = query(
        collection(db, GROUPED_ATTENDANCES_COLLECTION),
        where("estudianteUid", "==", studentUid)
      );
      
      const groupedSnapshot = await getDocs(groupedQuery);

      if (!groupedSnapshot.empty) {
        return groupedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // 2. FALLBACK: Si no hay datos agrupados, buscamos en las colecciones planas 
      // Pero filtrando desde el servidor para que la app no se trabe.
      const legacyAttendances = await this._getLegacyAttendances(studentUid);
      return legacyAttendances;

    } catch (error) {
      console.error("Error en FirebaseAttendanceReportRepository:", error);
      return [];
    }
  }

  subscribeToStudentAttendances(student, onData, onError) {
    const studentUid = student?.uid || student?.id;

    if (!studentUid) {
      console.warn("No se encontró UID del estudiante para escuchar reportes.");
      return () => {};
    }

    const groupedQuery = query(
      collection(db, GROUPED_ATTENDANCES_COLLECTION),
      where("estudianteUid", "==", studentUid)
    );

    return onSnapshot(
      groupedQuery,
      async (snapshot) => {
        try {
          if (!snapshot.empty) {
            onData(
              snapshot.docs.map((documentSnapshot) => ({
                id: documentSnapshot.id,
                ...documentSnapshot.data(),
              }))
            );
            return;
          }

          const legacyAttendances = await this._getLegacyAttendances(studentUid);
          onData(legacyAttendances);
        } catch (error) {
          console.error("Error escuchando asistencias del estudiante:", error);
          onError?.(error);
        }
      },
      onError
    );
  }

  // Método privado para buscar en colecciones viejas sin tumbar la app
  async _getLegacyAttendances(studentUid) {
    const results = [];
    
    // Intentamos buscar en 'attendances' y 'asistencias' usando query
    const collectionsToSearch = [PRIMARY_ATTENDANCES_COLLECTION, LEGACY_ATTENDANCES_COLLECTION];
    
    for (const collName of collectionsToSearch) {
      try {
        const q = query(collection(db, collName), where("estudianteUid", "==", studentUid));
        const snap = await getDocs(q);
        snap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
      } catch {
        // Si una colección no existe o falla, seguimos con la otra
        continue;
      }
    }
    
    return results;
  }
}

export default new FirebaseAttendanceReportRepository();
