import { format } from "date-fns";
import { requireUser } from "./_lib/auth";
import * as storage from "./_lib/storage";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  try {
    const user = await requireUser(req);
    const { startDate, endDate } = (req.query || {}) as Record<string, any>;
    if (!startDate || !endDate) {
      res.statusCode = 400;
      return res.end("Start and End date required");
    }

    const formattedStart = format(new Date(String(startDate)), "yyyy-MM-dd");
    const formattedEnd = format(new Date(String(endDate)), "yyyy-MM-dd");

    const data = await storage.getVisits({
      startDate: formattedStart,
      endDate: formattedEnd,
      accountId: user.id,
    });

    let csv = "\uFEFFArrivée,Nom du patient,Âge,Condition,Statut,Mutuelle,Mutuelle Remplie,Prix,Étape Suivante,Date\n";
    data.forEach((v) => {
      const arrival = v.arrivalTime ? format(new Date(v.arrivalTime), "HH:mm") : "--:--";
      csv += `"${arrival}","${v.patientName}","${v.age ?? ""}","${v.condition}","${v.status}","${v.mutuelle}","${v.mutuelleRemplie}","${v.price || 0}","${v.nextStep || ""}","${v.visitDate}"\n`;
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=clinic-export-${formattedStart}-to-${formattedEnd}.csv`,
    );
    res.end(csv);
  } catch (err: any) {
    res.statusCode = err?.statusCode || 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ message: err?.message || "Internal server error" }));
  }
}

