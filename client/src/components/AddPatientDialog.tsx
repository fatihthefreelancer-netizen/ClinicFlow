import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitSchema } from "@shared/schema";
import { useMockVisits } from "@/context/MockVisitsContext";
import { searchPatientsByName, VisitDTO } from "@/services/visitsService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertVisitSchema
  .pick({
    patientName: true,
    phoneNumber: true,
    age: true,
    mutuelle: true,
    mutuelleRemplie: true,
    condition: true,
  })
  .extend({
    patientName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    phoneNumber: z.string().regex(/^\d*$/, "Le numéro doit contenir uniquement des chiffres").optional(),
    age: z.number({ invalid_type_error: "L'âge doit être un nombre" }).min(0, "L'âge ne peut pas être négatif").optional(),
    condition: z.string().min(3, "Veuillez décrire la condition"),
    mutuelle: z.enum(["Oui", "Non"]),
    mutuelleRemplie: z.enum(["Oui", "Non"]),
  })
  .refine((data) => !(data.mutuelle === "Non" && data.mutuelleRemplie === "Oui"), {
    message: "Si Mutuelle est 'Non', Mutuelle remplie doit être 'Non'",
    path: ["mutuelleRemplie"],
  });

type FormValues = z.infer<typeof formSchema>;

interface AddPatientDialogProps {
  selectedDate: string;
}

export function AddPatientDialog({ selectedDate }: AddPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Autocomplete states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<VisitDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { addVisit } = useMockVisits();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      phoneNumber: "",
      age: undefined,
      mutuelle: "Non",
      mutuelleRemplie: "Non",
      condition: "",
    },
  });

  const mutuelleValue = form.watch("mutuelle");
  const mutuelleRemplieValue = form.watch("mutuelleRemplie");

  useEffect(() => {
    if (mutuelleValue === "Non" && mutuelleRemplieValue === "Oui") {
      form.setValue("mutuelleRemplie", "Non");
    }
  }, [mutuelleValue, mutuelleRemplieValue, form]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPatientsByName(searchQuery);
        setSuggestions(results);
        if (results.length > 0) {
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectSuggestion = (patient: VisitDTO) => {
    form.setValue("patientName", patient.patientName);
    if (patient.phoneNumber) form.setValue("phoneNumber", patient.phoneNumber);
    if (patient.age) form.setValue("age", patient.age);
    if (patient.mutuelle === "Oui" || patient.mutuelle === "Non") form.setValue("mutuelle", patient.mutuelle as "Oui" | "Non");
    if (patient.mutuelleRemplie === "Oui" || patient.mutuelleRemplie === "Non") form.setValue("mutuelleRemplie", patient.mutuelleRemplie as "Oui" | "Non");
    if (patient.condition) form.setValue("condition", patient.condition);
    
    setSearchQuery(patient.patientName);
    setShowSuggestions(false);
  };

  async function onSubmit(data: FormValues) {
    console.log("========== ADD PATIENT BUTTON CLICKED ==========");
    console.log("FORM DATA:", data);
    console.log("SELECTED DATE:", selectedDate);
    setIsSubmitting(true);
    try {
      await addVisit(selectedDate, {
        patientName: data.patientName,
        phoneNumber: data.phoneNumber || null,
        age: data.age ?? null,
        mutuelle: data.mutuelle,
        mutuelleRemplie: data.mutuelleRemplie,
        condition: data.condition,
        status: "waiting",
        price: null,
        nextStep: null,
        lastUpdatedBy: null,
      });
      console.log("ADD PATIENT SUCCESS");
      toast({
        title: "Patient ajouté",
        description: "Le patient a été ajouté à la file d'attente.",
      });
      setOpen(false);
      form.reset();
    } catch (err: unknown) {
      console.error("ADD PATIENT FAILED:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'ajouter le patient. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20 text-white rounded-xl px-6">
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un Nouveau Patient</DialogTitle>
          <DialogDescription>
            Saisissez les détails du patient pour l'ajouter à la file d'attente. L'heure d'arrivée est enregistrée automatiquement.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du Patient</FormLabel>
                  <FormControl>
                    <div className="relative" ref={wrapperRef}>
                      <Input
                        placeholder="Jean Dupont"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchQuery(e.target.value);
                          if (!showSuggestions && e.target.value.length >= 2) {
                            setShowSuggestions(true);
                          }
                        }}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2.5 text-slate-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      )}
                      
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden text-sm">
                          {suggestions.map((sugg) => (
                            <div
                              key={sugg.id}
                              className="px-4 py-2 hover:bg-slate-100 cursor-pointer flex flex-col transition-colors border-b last:border-b-0 border-slate-100"
                              onClick={() => handleSelectSuggestion(sugg)}
                            >
                              <span className="font-medium text-slate-900">{sugg.patientName}</span>
                              <span className="text-xs text-slate-500">
                                {sugg.phoneNumber ? `${sugg.phoneNumber} • ` : ""}
                                {sugg.condition}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="0612345678" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Âge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="45"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mutuelle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mutuelle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Oui">Oui</SelectItem>
                        <SelectItem value="Non">Non</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="mutuelleRemplie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutuelle Remplie</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={mutuelleValue === "Non"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pathologie / Symptômes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Fièvre, toux..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Ajout..." : "Ajouter à la file"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
