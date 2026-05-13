import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase/firebase";

const ATTENDANCE_DETAILS_COLLECTION = "asistencias_detalle";

const mapAttendanceDetail = (documentSnapshot) => ({
  id: documentSnapshot.id,
  ...documentSnapshot.data(),
});

class FirebaseAttendanceDetailsRepository {
  subscribeToTeacherAttendanceDetails({ docenteUid, cursoId, onData, onError }) {
    if (!docenteUid) {
      return () => {};
    }

    const constraints = [where("docenteUid", "==", docenteUid)];

    if (cursoId) {
      constraints.push(where("cursoId", "==", cursoId));
    }

    const attendanceQuery = query(
      collection(db, ATTENDANCE_DETAILS_COLLECTION),
      ...constraints
    );

    return onSnapshot(
      attendanceQuery,
      (snapshot) => {
        onData(snapshot.docs.map(mapAttendanceDetail));
      },
      onError
    );
  }
}

export default new FirebaseAttendanceDetailsRepository();
