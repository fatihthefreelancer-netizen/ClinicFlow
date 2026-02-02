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
import { type Visit } from "@shared/routes";
import { Trash2 } from "lucide-react";

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

  // Assistant restricted schema: can only edit name, condition, status
  // Doctor full schema: can edit everything including price, nextStep
  const isDoctor = role === "doctor";

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    values: visit || {
      patientName: "",
      condition: "",
      status: "waiting",
      price: undefined,
      nextStep: "",
    },
  });

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
    } catch (error) {
      console.error(error);
    }
  }

  const handleDelete = async () => {
    if (!visit || !confirm("Are you sure you want to remove this patient from the list?")) return;
    try {
      await deleteVisit(visit.id);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Patient Details</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="in_consultation">In Consultation</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="left">Left (No Show)</SelectItem>
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
                      <FormLabel>Price (Cents)</FormLabel>
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
                    <FormLabel>Next Steps / Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Prescription given, follow up in 2 weeks..." 
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
