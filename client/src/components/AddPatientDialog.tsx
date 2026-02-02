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
import { Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

// Helper schema for the form since some fields are auto-generated/defaults
const formSchema = insertVisitSchema.pick({
  patientName: true,
  condition: true,
}).extend({
  // Optional client-side only validations
  patientName: z.string().min(2, "Name must be at least 2 characters"),
  condition: z.string().min(3, "Please describe the condition"),
});

type FormValues = z.infer<typeof formSchema>;

export function AddPatientDialog() {
  const [open, setOpen] = useState(false);
  const { mutateAsync: createVisit, isPending } = useCreateVisit();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      condition: "",
    },
  });

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
          Add Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Enter patient details to add them to the queue. Arrival time is recorded automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition / Symptoms</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Fever, cough..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Adding..." : "Add to Queue"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
