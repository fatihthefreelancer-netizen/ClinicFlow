import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVisitSchema } from "@shared/schema";
import { useCreateVisit } from "@/hooks/use-visits";
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
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { z } from "zod";

// Helper schema for the form since some fields are auto-generated/defaults
const formSchema = insertVisitSchema.pick({
  patientName: true,
  age: true,
  mutuelle: true,
  mutuelleRemplie: true,
  condition: true,
}).extend({
  // Optional client-side only validations
  patientName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  age: z.number({ invalid_type_error: "L'âge doit être un nombre" }).min(0, "L'âge ne peut pas être négatif").optional(),
  condition: z.string().min(3, "Veuillez décrire la condition"),
  mutuelle: z.enum(["Oui", "Non"]),
  mutuelleRemplie: z.enum(["Oui", "Non"]),
}).refine((data) => !(data.mutuelle === "Non" && data.mutuelleRemplie === "Oui"), {
  message: "Si Mutuelle est 'Non', Mutuelle remplie doit être 'Non'",
  path: ["mutuelleRemplie"],
});

type FormValues = z.infer<typeof formSchema>;

export function AddPatientDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createVisit, isPending } = useCreateVisit();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      age: undefined,
      mutuelle: "Non",
      mutuelleRemplie: "Non",
      condition: "",
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
    try {
      await createVisit({
        ...data,
        status: "waiting", // Default status
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20 text-white rounded-xl px-6">
          <Plus className="w-5 h-5 mr-2" />
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
                    <Input placeholder="Jean Dupont" {...field} />
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
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Ajout..." : "Ajouter à la file"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
