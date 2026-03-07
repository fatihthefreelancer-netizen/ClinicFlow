/**
 * Mock visits dataset for frontend-only prototype.
 * Matches the app Visit shape: id, accountId, patientName, phoneNumber, age,
 * mutuelle, mutuelleRemplie, arrivalTime, condition, status, price, nextStep, visitDate.
 */

export type MockVisit = {
  id: number;
  accountId: string | null;
  patientName: string;
  phoneNumber: string | null;
  age: number | null;
  mutuelle: "Oui" | "Non";
  mutuelleRemplie: "Oui" | "Non";
  arrivalTime: string;
  condition: string;
  status: "waiting" | "in_consultation" | "done" | "left";
  price: number | null;
  nextStep: string | null;
  lastUpdatedBy: string | null;
  visitDate: string;
};

function mockVisit(
  id: number,
  date: string,
  patientName: string,
  condition: string,
  status: MockVisit["status"],
  opts: Partial<MockVisit> = {}
): MockVisit {
  const time = (opts.arrivalTime as string) ?? "09:00:00";
  const [h, m, s] = time.split(":").map(Number);
  const arrivalIso = `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s || 0).padStart(2, "0")}.000Z`;
  return {
    id,
    accountId: "mock-account",
    patientName,
    phoneNumber: opts.phoneNumber ?? null,
    age: opts.age ?? null,
    mutuelle: opts.mutuelle ?? "Non",
    mutuelleRemplie: opts.mutuelleRemplie ?? "Non",
    arrivalTime: arrivalIso,
    condition,
    status,
    price: opts.price ?? null,
    nextStep: opts.nextStep ?? null,
    lastUpdatedBy: null,
    visitDate: date,
  };
}

const day1 = "2026-03-05";
const day2 = "2026-03-06";
const day3 = "2026-03-07";

export const mockVisitsByDate: Record<string, MockVisit[]> = {
  [day1]: [
    mockVisit(1, day1, "Jean Dupont", "Fièvre, toux", "done", { arrivalTime: "08:30:00", age: 45, price: 300, nextStep: "Suivi si persistance" }),
    mockVisit(2, day1, "Marie Martin", "Mal de dos", "done", { arrivalTime: "09:15:00", phoneNumber: "0612345678", age: 52, mutuelle: "Oui", mutuelleRemplie: "Oui", price: 400 }),
    mockVisit(3, day1, "Ahmed El Amrani", "Migraine", "in_consultation", { arrivalTime: "09:45:00", age: 34 }),
    mockVisit(4, day1, "Sophie Bernard", "Angine", "waiting", { arrivalTime: "10:00:00", phoneNumber: "0698765432", age: 28, mutuelle: "Non" }),
    mockVisit(5, day1, "Pierre Lefebvre", "Douleur abdominale", "waiting", { arrivalTime: "10:20:00", age: 61, price: null, nextStep: null }),
    mockVisit(6, day1, "Fatima Zahra", "Contrôle tension", "done", { arrivalTime: "10:45:00", mutuelle: "Oui", mutuelleRemplie: "Non", price: 200 }),
    mockVisit(7, day1, "Lucas Petit", "Entorse cheville", "done", { arrivalTime: "11:10:00", age: 22, price: 350, nextStep: "Radiologie" }),
    mockVisit(8, day1, "Amélie Roux", "Symptômes grippaux", "in_consultation", { arrivalTime: "11:35:00", phoneNumber: "0687654321", age: null }),
    mockVisit(9, day1, "Omar Benali", "Dermatite", "waiting", { arrivalTime: "12:00:00", age: 41, mutuelle: "Non", price: null }),
    mockVisit(10, day1, "Claire Moreau", "Fatigue chronique", "left", { arrivalTime: "12:15:00", age: 38, nextStep: "Bilan sanguin" }),
  ],
  [day2]: [
    mockVisit(11, day2, "Thomas Dubois", "Rhume", "done", { arrivalTime: "08:00:00", age: 29, price: 250 }),
    mockVisit(12, day2, "Nadia Idrissi", "Mal de gorge", "done", { arrivalTime: "08:30:00", phoneNumber: "0611223344", mutuelle: "Oui", mutuelleRemplie: "Oui", price: 300 }),
    mockVisit(13, day2, "Hugo Girard", "Douleur thoracique", "in_consultation", { arrivalTime: "09:00:00", age: 55 }),
    mockVisit(14, day2, "Léa Fernandez", "Allergie", "waiting", { arrivalTime: "09:25:00", age: 19, price: null }),
    mockVisit(15, day2, "Youssef Alaoui", "Contrôle diabète", "done", { arrivalTime: "09:50:00", age: 67, price: 400, nextStep: "Rdv 3 mois" }),
    mockVisit(16, day2, "Julie Mercier", "Brûlure légère", "waiting", { arrivalTime: "10:15:00", phoneNumber: "0655443322", age: 31 }),
    mockVisit(17, day2, "Karim Tazi", "Hypertension", "done", { arrivalTime: "10:40:00", age: 58, mutuelle: "Non", price: 350 }),
    mockVisit(18, day2, "Emma Blanc", "Gastro-entérite", "in_consultation", { arrivalTime: "11:05:00", age: 24 }),
    mockVisit(19, day2, "Mehdi Kassimi", "Douleur articulaire", "waiting", { arrivalTime: "11:30:00", age: 44, price: null, nextStep: null }),
    mockVisit(20, day2, "Chloé Rousseau", "Anxiété", "done", { arrivalTime: "12:00:00", mutuelle: "Oui", mutuelleRemplie: "Non", price: 300 }),
    mockVisit(21, day2, "Adam Bennani", "Plaie main", "waiting", { arrivalTime: "12:20:00", phoneNumber: "0633445566", age: 36 }),
  ],
  [day3]: [
    mockVisit(22, day3, "Camille Laurent", "Otite", "done", { arrivalTime: "08:15:00", age: 12, price: 280 }),
    mockVisit(23, day3, "Rachid Fassi", "Troubles sommeil", "in_consultation", { arrivalTime: "08:45:00", age: 50, mutuelle: "Oui", mutuelleRemplie: "Oui" }),
    mockVisit(24, day3, "Manon Petit", "Conjonctivite", "waiting", { arrivalTime: "09:10:00", phoneNumber: "0644556677", age: 27 }),
    mockVisit(25, day3, "Ibrahim Cherkaoui", "Douleur lombaire", "done", { arrivalTime: "09:35:00", age: 42, price: 380, nextStep: "Kiné" }),
    mockVisit(26, day3, "Zoé Lambert", "Vaccination", "done", { arrivalTime: "10:00:00", age: 8, price: 150 }),
    mockVisit(27, day3, "Anas El Fahidi", "Asthme", "waiting", { arrivalTime: "10:25:00", age: 33, price: null }),
    mockVisit(28, day3, "Laura Simon", "Cystite", "in_consultation", { arrivalTime: "10:50:00", phoneNumber: "0677889900", age: 26, mutuelle: "Non" }),
    mockVisit(29, day3, "Hamza Moussaoui", "Contrôle post-op", "done", { arrivalTime: "11:15:00", age: 55, price: 200 }),
    mockVisit(30, day3, "Inès Gauthier", "Eczéma", "waiting", { arrivalTime: "11:40:00", age: 39, nextStep: "Dermato" }),
    mockVisit(31, day3, "Bilal Ait", "Mal de tête", "done", { arrivalTime: "12:05:00", price: 250 }),
    mockVisit(32, day3, "Jade Vincent", "État grippal", "left", { arrivalTime: "12:30:00", age: 21 }),
  ],
};
