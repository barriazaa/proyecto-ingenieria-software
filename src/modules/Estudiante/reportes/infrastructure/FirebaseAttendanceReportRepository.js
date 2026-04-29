import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/firebase";

const PRIMARY_ATTENDANCES_COLLECTION = "attendances";
const LEGACY_ATTENDANCES_COLLECTION = "asistencias";

const readCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    _collection: collectionName,
    ...documentSnapshot.data(),
  }));
};

const getAttendancesFromCollections = async () => {
  const primaryAttendances = await readCollection(PRIMARY_ATTENDANCES_COLLECTION);

  if (primaryAttendances.length > 0) {
    return primaryAttendances;
  }

  return readCollection(LEGACY_ATTENDANCES_COLLECTION);
};

const attendanceBelongsToStudent = (attendance, student) => {
  const studentIdentifiers = new Set(
    [student.uid, student.id, student.carnet, student.email, student.correo]
      .filter(Boolean)
      .map(String)
  );
  const attendanceIdentifiers = [
    attendance.studentUid,
    attendance.estudianteUid,
    attendance.alumnoUid,
    attendance.uid,
    attendance.studentId,
    attendance.estudianteId,
    attendance.alumnoId,
    attendance.carnet,
    attendance.email,
    attendance.correo,
  ];

  return attendanceIdentifiers
    .filter(Boolean)
    .map(String)
    .some((identifier) => studentIdentifiers.has(identifier));
};

class FirebaseAttendanceReportRepository {
  async getStudentAttendances(student) {
    const attendances = await getAttendancesFromCollections();
    return attendances.filter((attendance) => attendanceBelongsToStudent(attendance, student));
  }
}

export default new FirebaseAttendanceReportRepository();
