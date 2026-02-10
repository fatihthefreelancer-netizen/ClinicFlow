import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitSchema } from "@shared/schema";
import { useUpdateVisit, useDeleteVisit } from "@/hooks/use-visits";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { z } from "zod";
import { type Visit } from "@shared/schema";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";

interface EditVisitDialogProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Full schema for validation
const fullSchema = insertVisitSchema.partial();
type FormValues = z.infer<typeof fullSchema>;

export function EditVisitDialog({ visit, open, onOpenChange }: EditVisitDialogProps) {
  const { role } = useProfile();
  const { mutateAsync: updateVisit, isPending: isUpdating } = useUpdateVisit();
  const { mutateAsync: deleteVisit, isPending: isDeleting } = useDeleteVisit();

  // Assistant restricted schema: can only edit name, age, condition, status, mutuelle
  // Doctor full schema: can edit everything including price, nextStep
  const isDoctor = role === "doctor";

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    values: visit || {
      patientName: "",
      age: undefined,
      mutuelle: "Non",
      mutuelleRemplie: "Non",
      condition: "",
      status: "waiting",
      price: undefined,
      nextStep: "",
    },
  });

  // Business rule: If mutuelle is Non, mutuelleRemplie must be Non
  const mutuelleValue = form.watch("mutuelle");
  const mutuelleRemplieValue = form.watch("mutuelleRemplie");

  useEffect(() => {
    if (mutuelleValue === "Non" && mutuelleRemplieValue === "Oui") {
      form.setValue("mutuelleRemplie", "Non");
    }
  }, [mutuelleValue, mutuelleRemplieValue, form]);

  async function onSubmit(data: FormValues) {
    if (!visit) return;
    try {
      // Coerce price to number if it's a string from input
      const payload = { ...data };
      if (typeof payload.price === 'string' && payload.price !== '') {
        payload.price = parseInt(payload.price);
      }
      
      await updateVisit({ id: visit.id, ...payload });
      onOpenChange(false);
    } catch {
    }
  }

  const handleDelete = async () => {
    if (!visit || !confirm("Êtes-vous sûr de vouloir supprimer ce patient de la liste ?")) return;
    try {
      await deleteVisit(visit.id);
      onOpenChange(false);
    } catch {
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier les Détails du Patient</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nom du Patient</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Âge</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
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
                name="status"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="waiting">En attente</SelectItem>
                        <SelectItem value="in_consultation">En consultation</SelectItem>
                        <SelectItem value="done">Terminé</SelectItem>
                        <SelectItem value="left">Parti (Absent)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mutuelle"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Mutuelle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="mutuelleRemplie"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Mutuelle Remplie</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={mutuelleValue === "Non"}
                    >
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

              {isDoctor && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Prix (MAD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none h-20" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isDoctor && (
              <FormField
                control={form.control}
                name="nextStep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étapes Suivantes / Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Ordonnance délivrée, suivi dans 2 semaines..." 
                        className="resize-none h-20" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center justify-between pt-4 border-t mt-6">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
