import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitSchema } from "@shared/schema";
import { useMockVisits } from "@/context/MockVisitsContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { VisitLike } from "@/context/MockVisitsContext";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";

interface EditVisitDialogProps {
  visit: VisitLike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current date (YYYY-MM-DD) to refetch after update/delete */
  refetchDate?: string;
}

const fullSchema = insertVisitSchema.partial();
type FormValues = z.infer<typeof fullSchema>;

export function EditVisitDialog({ visit, open, onOpenChange, refetchDate }: EditVisitDialogProps) {
  const { updateVisit, deleteVisit } = useMockVisits();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const mutuelleValue = form.watch("mutuelle");
  const mutuelleRemplieValue = form.watch("mutuelleRemplie");

  useEffect(() => {
    if (mutuelleValue === "Non" && mutuelleRemplieValue === "Oui") {
      form.setValue("mutuelleRemplie", "Non");
    }
  }, [mutuelleValue, mutuelleRemplieValue, form]);

  async function onSubmit(data: FormValues) {
    console.log("========== EDIT PATIENT SAVE CLICKED ==========");
    console.log("FORM DATA:", data);
    console.log("VISIT ID:", visit?.id);
    if (!visit) return;
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (typeof payload.price === "string" && payload.price !== "") {
        payload.price = parseInt(payload.price);
      }
      await updateVisit(visit.id, payload, refetchDate);
      console.log("EDIT PATIENT SUCCESS");
      toast({
        title: "Modifications enregistrées",
        description: "Les données du patient ont été mises à jour.",
      });
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("EDIT PATIENT FAILED:", err);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'enregistrer les modifications. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteClick = () => {
    console.log("========== DELETE PATIENT BUTTON CLICKED ==========");
    console.log("VISIT ID:", visit?.id);
    if (!visit) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    console.log("========== DELETE PATIENT CONFIRMED ==========");
    console.log("DELETING VISIT ID:", visit?.id);
    if (!visit) return;
    setIsDeleting(true);
    try {
      await deleteVisit(visit.id, refetchDate);
      console.log("DELETE PATIENT SUCCESS");
      setShowDeleteConfirm(false);
      toast({
        title: "Patient supprimé",
        description: "Le patient a été retiré de la liste.",
      });
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("DELETE PATIENT FAILED:", err);
      setShowDeleteConfirm(false);
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de supprimer le patient. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]" data-testid="edit-visit-dialog">
          <DialogHeader>
            <DialogTitle>Modifier les Détails du Patient</DialogTitle>
            <DialogDescription>Modifiez les informations du patient ci-dessous.</DialogDescription>
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
                        <Input {...field} data-testid="input-edit-patient-name" />
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
                          data-testid="input-edit-age"
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
                          <SelectTrigger data-testid="select-edit-status">
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
                        <Input
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                          data-testid="input-edit-phone"
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
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Mutuelle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-mutuelle">
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
                          <SelectTrigger data-testid="select-edit-mutuelle-remplie">
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
                  name="price"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Prix (MAD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                          data-testid="input-edit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="resize-none h-20" data-testid="input-edit-condition" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextStep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étapes Suivantes / Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Ordonnance délivrée, suivi dans 2 semaines..."
                        className="resize-none h-20"
                        data-testid="input-edit-next-step"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between gap-2 pt-4 border-t mt-6">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting || isDeleting}
                  data-testid="button-delete-patient"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || isDeleting} data-testid="button-edit-cancel">
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isDeleting} data-testid="button-edit-save">
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Supprimer le patient"
        description="Cette action est irréversible. Le patient sera définitivement retiré de la liste."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
