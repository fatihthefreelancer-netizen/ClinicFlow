import { useState, useRef } from "react";
import { useVisits } from "@/hooks/use-visits";
import { useWebSocket } from "@/hooks/use-websocket";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { AddPatientDialog } from "@/components/AddPatientDialog";
import { EditVisitDialog } from "@/components/EditVisitDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Loader2, Calendar, FileDown } from "lucide-react";
import type { Visit } from "@shared/routes";
import * as XLSX from "xlsx";

export default function LiveBoard() {
  // Init WebSocket for real-time updates
  useWebSocket();

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: visits, isLoading } = useVisits({ date: selectedDate });
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter logic
  const filteredVisits = visits?.filter(visit => 
    visit.patientName.toLowerCase().includes(search.toLowerCase()) ||
    visit.condition.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleRowClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsEditDialogOpen(true);
  };

  const handleExportExcel = () => {
    if (!filteredVisits || filteredVisits.length === 0) return;

    const data = filteredVisits.map(v => ({
      "Arrivée": v.arrivalTime ? format(new Date(v.arrivalTime), "HH:mm") : "--:--",
      "Nom du patient": v.patientName,
      "Âge": v.age || "",
      "Condition": v.condition,
      "Statut": v.status,
      "Mutuelle": v.mutuelle,
      "Mutuelle Remplie": v.mutuelleRemplie,
      "Prix (MAD)": v.price || "",
      "Étape Suivante": v.nextStep || "",
      "Date": selectedDate
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");
    XLSX.writeFile(workbook, `clinic-export-${selectedDate}.xlsx`);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tableau des Patients</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Mises à jour en temps réel activées
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
             <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer pointer-events-none" />
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 w-full sm:w-auto bg-white border-slate-200 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
             </div>
             <div className="flex gap-2">
               <AddPatientDialog />
               <Button 
                 variant="outline" 
                 size="icon" 
                 onClick={handleExportExcel}
                 title="Exporter en Excel"
                 className="rounded-xl border-slate-200"
               >
                 <FileDown className="h-5 w-5" />
               </Button>
             </div>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6 p-1 bg-white/50 backdrop-blur-sm border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Rechercher par nom de patient ou pathologie..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
        </Card>

        {/* Main Table */}
        <Card className="overflow-hidden bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100 hover:bg-slate-50">
                  <TableHead className="w-[100px] font-semibold text-slate-600">Arrivée</TableHead>
                  <TableHead className="font-semibold text-slate-600">Nom du patient</TableHead>
                  <TableHead className="font-semibold text-slate-600">Numéro de téléphone</TableHead>
                  <TableHead className="w-[80px] font-semibold text-slate-600">Âge</TableHead>
                  <TableHead className="font-semibold text-slate-600">Condition</TableHead>
                  <TableHead className="w-[140px] font-semibold text-slate-600">Statut</TableHead>
                  <TableHead className="w-[100px] font-semibold text-slate-600">Mutuelle</TableHead>
                  <TableHead className="w-[140px] font-semibold text-slate-600">Mutuelle Remplie</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold text-slate-600">Prix</TableHead>
                  <TableHead className="w-[200px] font-semibold text-slate-600">Étape Suivante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>Chargement des visites...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <p className="text-slate-500 font-medium">Aucune visite trouvée pour cette date.</p>
                      <p className="text-sm text-slate-400">Ajoutez un patient pour commencer.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => (
                    <TableRow 
                      key={visit.id} 
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors border-slate-50"
                      onClick={() => handleRowClick(visit)}
                    >
                      <TableCell className="font-mono text-slate-500">
                        {visit.arrivalTime ? (function() {
                          try {
                            return format(new Date(visit.arrivalTime), "HH:mm");
                          } catch (e) {
                            return "--:--";
                          }
                        })() : "--:--"}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {visit.patientName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {visit.phoneNumber || "-"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {visit.age ?? "-"}
                      </TableCell>
                      <TableCell className="text-slate-600 max-w-[200px] truncate" title={visit.condition}>
                        {visit.condition}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={visit.status} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {visit.mutuelle}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {visit.mutuelleRemplie}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600">
                        {visit.price ? `${visit.price} Dhs` : "-"}
                      </TableCell>
                      <TableCell className="text-slate-500 max-w-[200px] truncate">
                        {visit.nextStep || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <EditVisitDialog 
        visit={selectedVisit} 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
      />
    </Layout>
  );
}
